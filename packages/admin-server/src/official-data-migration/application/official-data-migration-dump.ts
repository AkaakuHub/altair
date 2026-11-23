import type { OfficialDataMigrationPreview } from '@altair/runtime/admin/dto/official-data-migration.ts';
import {
	isJsonValue,
	type JsonValue,
} from '../../../../../src/state/json-state-utils.ts';

export type JsonRecord = Record<string, unknown>;

export type OfficialApiDumpEvent = {
	lineNo: number;
	path: string | null;
	apiSource: string | null;
	request: JsonRecord | null;
	response: JsonRecord | null;
	headers: Map<string, string>;
	statusCode: number | null;
};

export type OfficialDataMigrationDump = {
	manifest: JsonRecord;
	events: OfficialApiDumpEvent[];
	responsesByPath: Map<string, JsonRecord>;
	eventsByPath: Map<string, OfficialApiDumpEvent>;
	preview: OfficialDataMigrationPreview;
};

export function isRecord(value: unknown): value is JsonRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

export function readNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readBoolean(value: unknown): boolean {
	return value === true;
}

export function readRecord(value: unknown): JsonRecord | null {
	return isRecord(value) ? value : null;
}

export function readRecordArray(value: unknown): JsonRecord[] {
	return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function readProfileInfo(
	profileResponse: JsonRecord | undefined,
): JsonRecord | null {
	if (profileResponse === undefined) {
		return null;
	}
	return (
		readRecord(profileResponse.profile_info) ??
		readRecord(profileResponse.user_profile) ??
		readRecord(profileResponse.player)
	);
}

export function readNumberArray(value: unknown): number[] {
	return Array.isArray(value)
		? value.filter((entry): entry is number => Number.isFinite(entry))
		: [];
}

export function readJsonValueArray(value: unknown): JsonValue[] {
	return Array.isArray(value)
		? value.filter((entry): entry is JsonValue => isJsonValue(entry))
		: [];
}

export function parseJsonRecord(value: string): JsonRecord | null {
	try {
		return readRecord(JSON.parse(value) as unknown);
	} catch {
		return null;
	}
}

export function readStringNumber(value: string | undefined): number | null {
	if (value === undefined) {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}
