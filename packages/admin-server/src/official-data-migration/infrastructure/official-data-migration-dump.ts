import {
	isRecord,
	type JsonRecord,
	type OfficialApiDumpEvent,
	type OfficialDataMigrationDump,
	readNumber,
	readRecordArray,
} from '@altair/admin-server/official-data-migration/application/official-data-migration-dump.ts';
import type { OfficialDataMigrationDumpReader } from '@altair/admin-server/official-data-migration/application/official-data-migration-dump-reader.ts';
import { strFromU8, unzipSync } from 'fflate';
import { buildOfficialDataMigrationPreview } from '../application/preview/official-data-migration-preview.ts';
import {
	parseApiDumpJsonl,
	parseJsonEntryText,
} from './official-data-migration-events.ts';

const requiredEntries = [
	'manifest.json',
	'official_user_api_dump.jsonl',
	'official_user_request_audit.jsonl',
	'coverage.json',
];

const supportedFormatVersions = new Set([1, 2]);

export function createOfficialDataMigrationDumpReader(): OfficialDataMigrationDumpReader {
	return { read: parseOfficialDataMigrationDumpZip };
}

function parseOfficialDataMigrationDumpZip(
	data: Uint8Array,
): OfficialDataMigrationDump {
	const zipEntries = unzipSync(data);
	const errors: string[] = [];
	for (const entryName of requiredEntries) {
		if (zipEntries[entryName] === undefined) {
			errors.push(`missing zip entry: ${entryName}`);
		}
	}

	const manifest = parseJsonEntry(zipEntries, 'manifest.json', errors);
	validateManifestFormatVersion(manifest);
	const apiDumpText = readTextEntry(zipEntries, 'official_user_api_dump.jsonl');
	const events = parseApiDumpJsonl(apiDumpText, errors);
	const responsesByPath = collectLatestResponsesByPath(events);
	const eventsByPath = collectLatestEventsByPath(events);
	const preview = buildOfficialDataMigrationPreview(manifest, events, errors);

	return { manifest, events, responsesByPath, eventsByPath, preview };
}

function validateManifestFormatVersion(manifest: JsonRecord): void {
	const formatVersion = readNumber(manifest.format_version);
	if (formatVersion === null) {
		throw new Error('manifest.format_version is missing');
	}
	if (!supportedFormatVersions.has(formatVersion)) {
		throw new Error(`unsupported manifest.format_version: ${formatVersion}`);
	}
}

function readTextEntry(
	zipEntries: Record<string, Uint8Array>,
	entryName: string,
): string {
	const entry = zipEntries[entryName];
	if (entry === undefined) {
		return '';
	}
	return strFromU8(entry);
}

function parseJsonEntry(
	zipEntries: Record<string, Uint8Array>,
	entryName: string,
	errors: string[],
): JsonRecord {
	const text = readTextEntry(zipEntries, entryName);
	if (text.length === 0) {
		return {};
	}
	const parsed = parseJsonEntryText(text, entryName, errors);
	if (parsed === null) {
		return {};
	}
	if (!isRecord(parsed)) {
		errors.push(`zip entry is not a JSON object: ${entryName}`);
		return {};
	}
	return parsed;
}

function collectLatestResponsesByPath(
	events: OfficialApiDumpEvent[],
): Map<string, JsonRecord> {
	const responsesByPath = new Map<string, JsonRecord>();
	const selectedEventsByPath = new Map<
		string,
		OfficialApiDumpEvent & { response: JsonRecord }
	>();
	for (const event of events) {
		if (
			event.path === null ||
			event.response === null ||
			(event.statusCode !== null &&
				(event.statusCode < 200 || event.statusCode >= 400))
		) {
			continue;
		}
		const candidate: OfficialApiDumpEvent & {
			path: string;
			response: JsonRecord;
		} = {
			...event,
			path: event.path,
			response: event.response,
		};
		const currentEvent = selectedEventsByPath.get(candidate.path);
		if (
			currentEvent === undefined ||
			shouldReplaceResponse(candidate.path, currentEvent, candidate)
		) {
			responsesByPath.set(candidate.path, candidate.response);
			selectedEventsByPath.set(candidate.path, candidate);
		}
	}
	return responsesByPath;
}

function collectLatestEventsByPath(
	events: OfficialApiDumpEvent[],
): Map<string, OfficialApiDumpEvent> {
	const eventsByPath = new Map<string, OfficialApiDumpEvent>();
	for (const event of events) {
		if (
			event.path === null ||
			(event.statusCode !== null &&
				(event.statusCode < 200 || event.statusCode >= 400))
		) {
			continue;
		}
		eventsByPath.set(event.path, event);
	}
	return eventsByPath;
}

function shouldReplaceResponse(
	path: string,
	currentEvent: OfficialApiDumpEvent & { response: JsonRecord },
	nextEvent: OfficialApiDumpEvent & { path: string; response: JsonRecord },
): boolean {
	if (path === '/v1/user/items/get_list') {
		return (
			countInventoryItems(nextEvent.response) >
			countInventoryItems(currentEvent.response)
		);
	}
	if (
		currentEvent.apiSource !== 'official_direct' &&
		nextEvent.apiSource === 'official_direct'
	) {
		return true;
	}
	if (
		currentEvent.apiSource === 'official_direct' &&
		nextEvent.apiSource !== 'official_direct'
	) {
		return false;
	}
	return true;
}

function countInventoryItems(response: JsonRecord): number {
	return readRecordArray(response.item_category_list).reduce(
		(total, category) =>
			total + readRecordArray(category.user_item_list).length,
		0,
	);
}
