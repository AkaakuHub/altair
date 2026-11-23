import type {
	UserArchiveCollectionState,
	UserStickerState,
} from '../../../../../../src/state/archive-collection-definition.ts';
import {
	cloneJsonObject,
	type JsonObject,
} from '../../../../../../src/state/json-state-utils.ts';
import {
	type JsonRecord,
	type OfficialApiDumpEvent,
	type OfficialDataMigrationDump,
	readNumber,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function createArchiveCollectionFromDump(
	playerId: string,
	dump: OfficialDataMigrationDump,
): UserArchiveCollectionState | null {
	const archiveHome = dump.responsesByPath.get('/v1/archive/get_home');
	const stickerResponse = dump.responsesByPath.get(
		'/v1/collection/get_sticker_list',
	);
	if (archiveHome === undefined && stickerResponse === undefined) {
		return null;
	}
	return {
		playerId,
		...(archiveHome !== undefined
			? { archiveHome: cloneJsonObject(archiveHome, 'official archive home') }
			: {}),
		...createArchiveListState(dump.events),
		watchedWithliveArchiveIds: collectWatchedArchiveIds(dump.events, [
			'/v1/archive/get_with_archive_data',
			'/v1/archive/withlive_info',
		]),
		watchedFesArchiveIds: collectWatchedArchiveIds(dump.events, [
			'/v1/archive/get_fes_archive_data',
		]),
		watchedWithliveArchiveMemberships: [],
		watchedFesArchiveMemberships: [],
		userStickerStates: readRecordArray(stickerResponse?.sticker_info_list)
			.map(createUserStickerState)
			.filter((sticker): sticker is UserStickerState => sticker !== null),
	};
}

export function mergeMigratedArchiveCollection(
	current: UserArchiveCollectionState | undefined,
	legacy: UserArchiveCollectionState,
): UserArchiveCollectionState {
	if (current === undefined) return legacy;
	return {
		...legacy,
		userStickerStates: [
			...current.userStickerStates.filter(
				(sticker) => sticker.identityFingerprint !== undefined,
			),
			...legacy.userStickerStates,
		],
	};
}

function createArchiveListState(events: readonly OfficialApiDumpEvent[]): {
	archiveList?: JsonObject[];
	filterableCharacters?: JsonObject[];
	sortableFields?: JsonObject[];
} {
	const responses = events.filter(
		(event) =>
			event.path === '/v1/archive/get_archive_list' &&
			event.response !== null &&
			isSuccessfulStatus(event),
	);
	if (responses.length === 0) {
		return {};
	}
	const archiveList = dedupeArchiveList(
		responses.flatMap((event) => readRecordArray(event.response?.archive_list)),
	);
	const latest = responses.at(-1)?.response;
	return {
		archiveList,
		filterableCharacters: readJsonObjectArray(latest?.filterable_characters),
		sortableFields: readJsonObjectArray(latest?.sortable_fields),
	};
}

function dedupeArchiveList(archives: JsonRecord[]): JsonObject[] {
	const values = new Map<string, JsonObject>();
	for (const archive of archives) {
		const archiveId = readArchiveId(archive);
		if (archiveId.length > 0) {
			values.set(archiveId, cloneJsonObject(archive, 'official archive list'));
		}
	}
	return [...values.values()];
}

function collectWatchedArchiveIds(
	events: readonly OfficialApiDumpEvent[],
	paths: readonly string[],
): string[] {
	const ids = new Set<string>();
	for (const event of events) {
		if (!paths.includes(event.path ?? '') || !isSuccessfulStatus(event)) {
			continue;
		}
		const archiveId = readArchiveId(event.response);
		if (archiveId.length > 0) {
			ids.add(archiveId);
		}
	}
	return [...ids];
}

function readArchiveId(value: unknown): string {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return '';
	}
	const record = value as JsonRecord;
	return (
		readString(record.archives_id) ??
		readString(record.archive_id) ??
		readString(record.live_id) ??
		readString(record.present_box_id) ??
		''
	);
}

function readJsonObjectArray(value: unknown): JsonObject[] {
	return readRecordArray(value).map((record) =>
		cloneJsonObject(record, 'official archive metadata'),
	);
}

function isSuccessfulStatus(event: OfficialApiDumpEvent): boolean {
	return (
		event.statusCode === null ||
		(event.statusCode >= 200 && event.statusCode < 400)
	);
}

function createUserStickerState(sticker: JsonRecord): UserStickerState | null {
	const stickersId = readNumber(sticker.stickers_id);
	if (stickersId === null) {
		return null;
	}
	return {
		stickerId: stickersId,
		requirementProgress: readNumber(sticker.requirement_progress) ?? 0,
		variantRequirementProgress:
			readNumber(sticker.variant_requirement_progress) ?? 0,
		isOwned: sticker.is_owned === true,
		isAvailableVariant: sticker.is_available_variant === true,
		createTime:
			typeof sticker.create_time === 'string' ? sticker.create_time : null,
	};
}
