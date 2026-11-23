import type { Database } from 'bun:sqlite';
import { getQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { findUserQuestStageProgress } from '../../state/user-standard-quest-progress.ts';
import type {
	QuestClearStatus,
	QuestClearStatusListResponse,
	StandardQuestStageDataResponse,
	StandardQuestStageSelectResponse,
} from '../response-types/standard-quest-response-types.ts';
import { isJsonRecord } from '../route-support/request-fields.ts';
import { stamina } from './basic-data.ts';
import { numberField, numberValue } from './json-utils.ts';
import { musicListForQuestFromDatabase } from './music-list-data.ts';
import { findQuestStageMusicFromDatabase } from './quest-stage-data.ts';
import {
	questClearStatus,
	sequentialStageStates,
} from './quest-stage-progression.ts';
import {
	findItemSourceStandardQuestStageIds,
	findStandardQuestStageAreaId,
	listStandardQuestStageIds,
} from './standard-quest-master-query.ts';
import {
	compareQuestClearStatus,
	parseStandardQuestStageIdList,
	standardQuestStageDetail,
} from './standard-quest-response-mappers.ts';
import type { JsonRecord, StoredResponse } from './types.ts';

export function getQuestStageSelect(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
): StoredResponse<StandardQuestStageSelectResponse> | undefined {
	const areaId = numberField(body, 'area_id');
	if (areaId === 0) {
		return undefined;
	}
	const rows = listStandardQuestStageIds(database, areaId);
	const stageStates = standardStageStates(database, rows, userLive);
	return {
		body: {
			stage_list: stageStates.map(({ row, progress, isLock }) => ({
				stage_id: row.stage_id,
				clear_status: questClearStatus(progress),
				is_lock: isLock,
			})),
			user_stamina: stamina(),
			is_update_grade_live: false,
		},
		statusCode: 200,
	};
}

export function getQuestStageData(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
): StoredResponse<StandardQuestStageDataResponse> | undefined {
	const areaId = numberField(body, 'area_id');
	if (areaId === 0) {
		return undefined;
	}
	const viewStageId = numberField(body, 'stage_id');
	const rows = listStandardQuestStageIds(database, areaId);

	const unlockedRows = standardStageStates(database, rows, userLive)
		.filter((stage) => !stage.isLock)
		.map((stage) => stage.row);
	const viewStage = findQuestStageMusicFromDatabase(database, viewStageId);

	return {
		body: {
			view_stage_id: viewStageId,
			stage_detail_list: unlockedRows.map((row) =>
				standardQuestStageDetail(
					row.stage_id,
					findUserQuestStageProgress(
						userLive,
						1,
						row.stage_id,
						getQuestStageIdentityFingerprint(database, 1, row.stage_id),
					),
				),
			),
			user_stamina: stamina(),
			music_list: musicListForQuestFromDatabase(
				database,
				viewStage.questMusicsType,
				viewStage.musicId,
			),
		},
		statusCode: 200,
	};
}

export function getQuestClearStatusList(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
): StoredResponse<QuestClearStatusListResponse> | undefined {
	const itemId = numberField(body, 'items_id');
	if (itemId === 0) {
		return undefined;
	}
	const stageIds = findItemSourceStandardQuestStageIds(database, itemId);
	if (stageIds === undefined) {
		return undefined;
	}
	const questClearStatusList = parseStandardQuestStageIdList(stageIds)
		.map((stageId) => getStandardQuestClearStatus(database, userLive, stageId))
		.filter((status) => status !== undefined)
		.sort(compareQuestClearStatus);
	return {
		body: {
			quest_clear_status_list: questClearStatusList,
		},
		statusCode: 200,
	};
}

export function applyStandardAreaLocks(
	database: Database,
	response: JsonRecord,
	userLive: UserLiveState,
): JsonRecord {
	if (!isJsonRecord(response.standard_area_select)) {
		return response;
	}
	const areaList = Array.isArray(response.standard_area_select.area_list)
		? response.standard_area_select.area_list
		: [];
	response.standard_area_select.area_list = areaList.map((area) => {
		if (!isJsonRecord(area)) {
			return area;
		}
		const areaId = numberValue(area.area_id);
		return {
			...area,
			is_lock: !isStandardAreaUnlocked(database, userLive, areaId),
		};
	});
	return response;
}

export function setStandardAreaSelectViewHistory(): StoredResponse<null> {
	return { body: null, statusCode: 200 };
}

function getStandardQuestClearStatus(
	database: Database,
	userLive: UserLiveState,
	stageId: number,
): QuestClearStatus | undefined {
	const areaId = findStandardQuestStageAreaId(database, stageId);
	if (areaId === undefined) {
		return undefined;
	}
	const progress = findUserQuestStageProgress(
		userLive,
		1,
		stageId,
		getQuestStageIdentityFingerprint(database, 1, stageId),
	);
	return {
		stages_id: stageId,
		quest_live_type: 1,
		is_lock: isStandardStageLocked(database, userLive, areaId, stageId),
		star_num: questClearStatus(progress),
	};
}

function isStandardStageLocked(
	database: Database,
	userLive: UserLiveState,
	areaId: number,
	stageId: number,
): boolean {
	if (!isStandardAreaUnlocked(database, userLive, areaId)) {
		return true;
	}
	const rows = listStandardQuestStageIds(database, areaId);
	const stageState = standardStageStates(database, rows, userLive).find(
		(value) => value.row.stage_id === stageId,
	);
	return stageState?.isLock ?? true;
}

function isStandardAreaUnlocked(
	database: Database,
	userLive: UserLiveState,
	areaId: number,
): boolean {
	if (areaId === 0) {
		return false;
	}
	if (areaId % 100 === 1) {
		return true;
	}
	return isStandardAreaCleared(database, userLive, areaId - 1);
}

function isStandardAreaCleared(
	database: Database,
	userLive: UserLiveState,
	areaId: number,
): boolean {
	const stageIds = listStandardQuestStageIds(database, areaId);
	return (
		stageIds.length > 0 &&
		stageIds.every(
			(row) =>
				findUserQuestStageProgress(
					userLive,
					1,
					row.stage_id,
					getQuestStageIdentityFingerprint(database, 1, row.stage_id),
				).playCount > 0,
		)
	);
}

function standardStageStates<T extends { stage_id: number }>(
	database: Database,
	rows: T[],
	userLive: UserLiveState,
) {
	return sequentialStageStates(rows, userLive, 1, (stageId) =>
		getQuestStageIdentityFingerprint(database, 1, stageId),
	);
}
