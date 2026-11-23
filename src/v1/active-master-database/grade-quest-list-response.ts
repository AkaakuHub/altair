import type { Database } from 'bun:sqlite';
import { getGradeQuestSeriesIdentityFingerprint } from '../../master-data/grade-progress-identity.ts';
import { findCompatibleGradeQuestProgress } from '../../state/user-grade-quest-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	getGradeQuestSeasonIds,
	getGradeQuestSeriesRewards,
	getGradeQuestSeriesRows,
} from './grade-quest-master.ts';

export function getGradeQuestList(database: Database, userLive: UserLiveState) {
	return {
		body: {
			quest_season_list: getGradeQuestSeasonIds(database).map((seasonId) =>
				createGradeQuestSeason(database, seasonId, userLive),
			),
			point_bonus_list: [] satisfies [],
			is_update_grade_live: false,
		},
		statusCode: 200,
	};
}

function createGradeQuestSeason(
	database: Database,
	seasonId: number,
	userLive: UserLiveState,
) {
	const rows = getGradeQuestSeriesRows(database, seasonId);
	let previousCleared = false;
	let clearNum = 0;
	const questSeriesList = rows.map((row, index) => {
		if (index === 0) {
			previousCleared = row.order_id === 1;
		}
		const fingerprint = getGradeQuestSeriesIdentityFingerprint(
			database,
			row.id,
		);
		const clearStatus =
			fingerprint === undefined
				? 0
				: (findCompatibleGradeQuestProgress(
						userLive.gradeQuestProgressList,
						row.id,
						fingerprint,
					)?.clearStatus ?? 0);
		const cleared = clearStatus > 0;
		const isLock = !previousCleared;
		if (cleared) {
			clearNum += 1;
		}
		previousCleared = cleared;
		return {
			grade_quest_series_id: row.id,
			play_status: 0,
			is_lock: isLock,
			clear_status: clearStatus,
			reward_list: getGradeQuestSeriesRewards(database, row.id).map(
				(reward) => ({
					grade_quest_rewards_id: reward.id,
					is_received: cleared,
				}),
			),
		};
	});
	return {
		grade_quest_season_id: seasonId,
		play_status: 0,
		is_lock:
			clearNum === 0 &&
			questSeriesList.length > 0 &&
			questSeriesList[0]?.is_lock === true,
		clear_num: clearNum,
		quest_series_list: questSeriesList,
	};
}
