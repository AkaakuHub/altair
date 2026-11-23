import type { Database } from 'bun:sqlite';
import type { ArchivePrizeMaster } from '../state/archive-prize-definition.ts';
import {
	cloneJsonObject,
	isRecord,
	type JsonObject,
	type JsonValue,
} from '../state/json-state-utils.ts';
import type { SavedArchiveListEntry } from '../v1/response-types/archive/savedArchiveListEntry.ts';
import type { SavedStationListEntry } from '../v1/response-types/archive/savedStationListEntry.ts';

type ArchiveResponseJsonRow = {
	response_json: string;
};

type ArchiveFilterableCharacterRow = {
	character_id: number;
	label: string;
};

type ArchiveSortableFieldRow = {
	key: string;
	label: string;
};

type ArchivePrizeRow = {
	archives_id: string;
	title: string;
	live_start_time: string;
	characters: string;
	gift_star_reward_segments: string | null;
	gift_stars_threshold_for_extra_admission: number;
};

type WithStationPrizeRow = {
	live_id: string;
	title: string;
	start_time: string;
	characters: string;
	gift_star_reward_segments: string | null;
	gift_stars_threshold_for_extra_admission: number;
};

export function getArchiveListFromDatabase(database: Database) {
	return readArchiveResponseJsonRows<SavedArchiveListEntry>(
		database,
		'archive_list',
	);
}

export function getWithStationListItemsFromDatabase(database: Database) {
	return readArchiveResponseJsonRows<SavedStationListEntry>(
		database,
		'with_station_list',
	).map((withStation) => ({
		...withStation,
		earned_star_count: 0,
		has_extra_admission: false,
	}));
}

export function getArchiveFilterableCharactersFromDatabase(database: Database) {
	return database
		.query<ArchiveFilterableCharacterRow, []>(
			'SELECT character_id, label FROM archive_filterable_character ORDER BY order_id',
		)
		.all()
		.map((row) => ({ character_id: row.character_id, label: row.label }));
}

export function getArchiveSortableFieldsFromDatabase(database: Database) {
	return database
		.query<ArchiveSortableFieldRow, []>(
			'SELECT key, label FROM archive_sortable_field ORDER BY order_id',
		)
		.all()
		.map((row) => ({ key: row.key, label: row.label }));
}

function readArchiveResponseJsonRows<T extends JsonObject>(
	database: Database,
	tableName: 'archive_list' | 'with_station_list',
): T[] {
	return database
		.query<ArchiveResponseJsonRow, []>(
			`SELECT response_json FROM ${tableName} ORDER BY row_index`,
		)
		.all()
		.map(
			(row) =>
				cloneJsonObject(
					JSON.parse(row.response_json) as JsonValue,
					`${tableName}.response_json`,
				) as T,
		);
}

export function getArchivePrizeMasterFromDatabase(
	database: Database,
	liveId: string,
): ArchivePrizeMaster | undefined {
	if (liveId.length === 0) {
		return undefined;
	}
	const row = database
		.query<ArchivePrizeRow, [string]>(
			[
				'SELECT archives_id, title, live_start_time, characters, gift_star_reward_segments, gift_stars_threshold_for_extra_admission',
				'FROM archive_detail',
				'WHERE archives_id = ?',
			].join(' '),
		)
		.get(liveId);
	if (!row) {
		return undefined;
	}
	return {
		liveId: row.archives_id,
		title: row.title,
		liveStartTime: row.live_start_time,
		characterIds: readCharacterIds(row.characters),
		giftStarRewardSegments: parseArchiveGiftStarRewardSegments(
			row.gift_star_reward_segments,
		),
		giftStarsThresholdForExtraAdmission:
			row.gift_stars_threshold_for_extra_admission,
	};
}

export function getWithStationPrizeMasterFromDatabase(
	database: Database,
	liveId: string,
): ArchivePrizeMaster | undefined {
	if (liveId.length === 0) {
		return undefined;
	}
	const row = database
		.query<WithStationPrizeRow, [string]>(
			[
				'SELECT live_id, title, start_time, characters, gift_star_reward_segments, gift_stars_threshold_for_extra_admission',
				'FROM with_station_detail',
				'WHERE live_id = ?',
			].join(' '),
		)
		.get(liveId);
	if (!row) {
		return undefined;
	}
	return {
		liveId: row.live_id,
		title: row.title,
		liveStartTime: row.start_time,
		characterIds: readCharacterIds(row.characters),
		giftStarRewardSegments: parseArchiveGiftStarRewardSegments(
			row.gift_star_reward_segments,
		),
		giftStarsThresholdForExtraAdmission:
			row.gift_stars_threshold_for_extra_admission,
	};
}

function readCharacterIds(value: string): number[] {
	if (value.length === 0) {
		return [];
	}
	const parsed = JSON.parse(value) as unknown;
	if (!Array.isArray(parsed)) {
		return [];
	}
	return parsed
		.map((entry) =>
			isRecord(entry) && typeof entry.character_id === 'number'
				? entry.character_id
				: undefined,
		)
		.filter((characterId): characterId is number => characterId !== undefined);
}

export function parseArchiveGiftStarRewardSegments(
	value: string | null,
): number[] | null {
	if (value === null) return null;
	const parsed = JSON.parse(value) as unknown;
	if (!Array.isArray(parsed)) {
		throw new Error('Archive gift star reward segments must be a JSON array');
	}
	if (
		parsed.some(
			(entry) => typeof entry !== 'number' || !Number.isSafeInteger(entry),
		)
	) {
		throw new Error('Archive gift star reward segment must be a safe integer');
	}
	return parsed;
}
