import type { Database } from 'bun:sqlite';
import { getQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import { findUserDreamLiveProgress } from '../../state/user-dream-quest-progress.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import type { MemberFanLevelState } from '../../state/user-status-types.ts';
import {
	createDreamLiveConditionResponse,
	dreamLiveConditionItemId,
} from './dream-live-condition.ts';
import {
	getDreamLiveConditionRows,
	getDreamQuestSeriesRows,
	getFirstDreamQuestStage,
	getItemNameById,
} from './dream-live-master.ts';
import { musicListByColumnFromDatabase } from './music-list-data.ts';
import type { JsonRecord } from './types.ts';

export function applyDreamLiveMemberSelect<T extends JsonRecord>(
	database: Database,
	response: T,
	userLive: UserLiveState,
	userCards: UserCardCollectionState,
	inventory: UserInventoryState,
	memberFanLevels: ReadonlyArray<MemberFanLevelState>,
) {
	const dreamLiveMemberSelect = getDreamQuestSeriesRows(database).map(
		(series) => {
			const stage = getFirstDreamQuestStage(database, series.id);
			const progress = findUserDreamLiveProgress(
				userLive,
				stage.id,
				getQuestStageIdentityFingerprint(database, 5, stage.id),
			);
			return {
				dream_quest_series_id: series.id,
				dream_quest_stages_id: stage.id,
				clear_times: progress.clearTimes,
				is_clear: progress.clearTimes > 0,
				is_get_card: progress.isGetCard,
				limit_break_times: progress.limitBreakTimes,
				condition_list: getDreamLiveConditionRows(database, stage.id).map(
					(condition) => {
						const itemId = dreamLiveConditionItemId(condition, series);
						return createDreamLiveConditionResponse(
							condition,
							series,
							userCards,
							inventory,
							memberFanLevels,
							itemId === undefined
								? undefined
								: getItemNameById(database, itemId),
						);
					},
				),
				music_list: musicListByColumnFromDatabase(
					database,
					'center_character_id',
					series.characters_id,
				),
				dream_live_series_id: series.dream_live_series_list_id,
			};
		},
	);
	return Object.assign(response, {
		dream_live_member_select: dreamLiveMemberSelect,
	});
}
