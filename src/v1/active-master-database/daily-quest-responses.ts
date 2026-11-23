import type { Database } from 'bun:sqlite';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { findUserQuestStageProgress } from '../../state/user-standard-quest-progress.ts';
import type { UserDailyTicketInfo } from '../response-types/app-content-response-types.ts';
import type {
	DailyQuestStageDataResponse,
	DailyQuestStageListResponse,
} from '../response-types/daily-quest-response-types.ts';
import { numberField } from './json-utils.ts';
import { musicListWithScoreFromDatabase } from './music-list-data.ts';
import {
	questClearStatus,
	sequentialStageStates,
} from './quest-stage-progression.ts';
import type { StoredResponse } from './types.ts';

export function getDailyQuestStageList(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
	userDailyTicketInfo: UserDailyTicketInfo,
): StoredResponse<DailyQuestStageListResponse> | undefined {
	const questId = numberField(body, 'quest_id');
	if (questId === 0) {
		return undefined;
	}
	const rows = database
		.query<{ stage_id: number }, [number]>(
			'SELECT id AS stage_id FROM master_daily_quest_stages WHERE daily_quest_series_id = ? ORDER BY id',
		)
		.all(questId);
	const stageStates = sequentialStageStates(rows, userLive, 2);
	return {
		body: {
			user_daily_ticket_info: userDailyTicketInfo,
			stage_list: stageStates.map(({ row, progress, isLock }) => ({
				stage_id: row.stage_id,
				clear_status: questClearStatus(progress),
				is_lock: isLock,
			})),
		},
		statusCode: 200,
	};
}

export function getDailyQuestStageData(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
	userDailyTicketInfo: UserDailyTicketInfo,
): StoredResponse<DailyQuestStageDataResponse> | undefined {
	const stageId = numberField(body, 'stage_id');
	if (stageId === 0) {
		return undefined;
	}
	const musicList = musicListWithScoreFromDatabase(database);
	const progress = findUserQuestStageProgress(userLive, 2, stageId);
	return {
		body: {
			stage_id: stageId,
			clear_status: questClearStatus(progress),
			best_love_music_id: progress.bestLoveMusicId ?? 0,
			user_daily_ticket_info: userDailyTicketInfo,
			stage_reward_list: [],
			best_love: progress.highScore,
			music_list: musicList,
		},
		statusCode: 200,
	};
}
