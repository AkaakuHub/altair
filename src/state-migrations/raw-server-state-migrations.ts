import type { ChapterRuntimeState } from '../server-state-schema.ts';
import { isRecord } from '../state/json-state-utils.ts';
import { migrateRawUserStickerStates } from './raw-collection-state-migrations.ts';
import {
	migrateRawShopExchangeStates,
	migrateRawSiscaStoreStates,
} from './raw-commerce-state-migrations.ts';
import {
	migrateRawBeginnerMissionStates,
	migrateRawMissionStates,
} from './raw-mission-state-migrations.ts';
import {
	migrateRawChapterStates,
	migrateRawGradeQuestStates,
} from './raw-quest-state-migrations.ts';

export function applyRawServerStateMigrations(
	value: unknown,
	chapterDefaults?: ChapterRuntimeState,
): unknown {
	if (!isRecord(value)) return value;
	migrateMasterReleaseIdentityNames(value);
	if (value.chapter === undefined && chapterDefaults !== undefined) {
		value.chapter = structuredClone(chapterDefaults);
	}
	migrateRawMissionStates(value);
	migrateRawBeginnerMissionStates(value);
	migrateRawChapterStates(value);
	migrateRawUserStickerStates(value);
	migrateRawShopExchangeStates(value);
	migrateRawSiscaStoreStates(value);
	migrateRawGradeQuestStates(value);
	addUnlockedActivityRecordAdvDataIds(value);
	addActivityRecordMasterMemberships(value);
	addArchiveWatchedMemberships(value);
	return value;
}

const masterReleaseIdentityNames = new Map([
	['masterSnapshotId', 'masterReleaseId'],
	['sourceSnapshotId', 'sourceMasterReleaseId'],
	['definitionSnapshotId', 'definitionMasterReleaseId'],
	['displayCardSourceSnapshotId', 'displayCardSourceMasterReleaseId'],
	['source_snapshot_id', 'source_master_release_id'],
	['guaranteeExchangeSnapshotId', 'guaranteeExchangeMasterReleaseId'],
	['selectTicketExchangeSnapshotId', 'selectTicketExchangeMasterReleaseId'],
	['currentWithliveArchiveSnapshotId', 'currentWithliveArchiveMasterReleaseId'],
	[
		'currentWithstationArchiveSnapshotId',
		'currentWithstationArchiveMasterReleaseId',
	],
]);

function migrateMasterReleaseIdentityNames(value: unknown): void {
	if (Array.isArray(value)) {
		for (const entry of value) migrateMasterReleaseIdentityNames(entry);
		return;
	}
	if (!isRecord(value)) return;
	for (const [legacyName, activeName] of masterReleaseIdentityNames) {
		if (value[legacyName] !== undefined && value[activeName] === undefined) {
			value[activeName] = value[legacyName];
		}
		delete value[legacyName];
	}
	for (const entry of Object.values(value)) {
		migrateMasterReleaseIdentityNames(entry);
	}
}

function addArchiveWatchedMemberships(state: Record<string, unknown>): void {
	if (!Array.isArray(state.userArchiveCollections)) return;
	for (const collection of state.userArchiveCollections) {
		if (!isRecord(collection)) continue;
		collection.watchedWithliveArchiveMemberships ??= [];
		collection.watchedFesArchiveMemberships ??= [];
	}
}

function addActivityRecordMasterMemberships(
	state: Record<string, unknown>,
): void {
	if (!Array.isArray(state.userActivityRecords)) return;
	for (const activityRecord of state.userActivityRecords) {
		if (!isRecord(activityRecord)) continue;
		activityRecord.watchedActivityRecordAdvMemberships ??= [];
		activityRecord.displayedActivityRecordAdvSeriesMemberships ??= [];
		activityRecord.unlockedActivityRecordAdvMemberships ??= [];
	}
}

function addUnlockedActivityRecordAdvDataIds(
	state: Record<string, unknown>,
): void {
	if (!Array.isArray(state.userActivityRecords)) return;
	for (const activityRecord of state.userActivityRecords) {
		if (
			isRecord(activityRecord) &&
			activityRecord.unlockedActivityRecordAdvDataIds === undefined
		) {
			activityRecord.unlockedActivityRecordAdvDataIds = [];
		}
	}
}
