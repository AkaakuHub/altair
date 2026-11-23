import type { Database } from 'bun:sqlite';
import type { UserCurrentQuestLiveState } from '../../state/user-current-quest-live-state.ts';
import { ensureUserGrandPrixState } from '../../state/user-grand-prix-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import type { QuestMemberFanLevelResponse } from '../response-types/quest-common-response-types.ts';
import { findGrandPrixIdByStageIdFromDatabase } from './grand-prix-result-master-query.ts';
import {
	fanLevelInfoListFromState,
	sectionSkillListFromDatabase,
} from './quest-stage-data.ts';

export function getQuestLiveInfo(
	database: Database,
	userLive: UserLiveState,
	fanLevelList: readonly QuestMemberFanLevelResponse[],
) {
	const currentQuestLive = userLive.currentQuestLive;
	if (!currentQuestLive) {
		return undefined;
	}
	return {
		body: createQuestLiveInfoBody(
			database,
			currentQuestLive,
			userLive,
			fanLevelList,
		),
		statusCode: 200,
	};
}

export function createQuestLiveInfoBody(
	database: Database,
	currentQuestLive: UserCurrentQuestLiveState,
	userLive: UserLiveState,
	fanLevelList: readonly QuestMemberFanLevelResponse[],
) {
	return {
		result: true,
		quest_live_id: currentQuestLive.questLiveId,
		quest_live_type: currentQuestLive.questLiveType,
		quest_id: currentQuestLive.stageId,
		is_challenge_mode: currentQuestLive.isChallengeMode,
		music_id: currentQuestLive.musicId,
		deck_data: currentQuestLive.deckData,
		rental_deck_data: {
			rental_deck_id: 0,
			rental_deck_cards_list: null,
			grade_bonus_value: 0,
			is_released: false,
		},
		character_bonus: currentQuestLive.characterBonus,
		section_skill_list: sectionSkillListFromDatabase(
			database,
			currentQuestLive.stageId,
		),
		init_hand_data: '',
		grand_prix_retry_count: 0,
		grand_prix_is_rehearsal: currentQuestLive.isRehearsal ?? false,
		grand_prix_id:
			currentQuestLive.questLiveType === 6
				? (findGrandPrixIdByStageIdFromDatabase(
						database,
						currentQuestLive.stageId,
					) ?? 0)
				: 0,
		grade_retry_count: currentQuestLive.questLiveType === 4 ? 1 : 0,
		grade_add_skill_list: [] satisfies [],
		playable_count: currentQuestLive.questLiveType === 6 ? 1 : 0,
		play_count: questLiveGrandPrixPlayCount(
			database,
			currentQuestLive,
			userLive,
		),
		fan_level_info_list: fanLevelInfoListFromState(fanLevelList),
	};
}

function questLiveGrandPrixPlayCount(
	database: Database,
	currentQuestLive: UserCurrentQuestLiveState,
	userLive: UserLiveState,
): number {
	if (currentQuestLive.questLiveType !== 6) {
		return 0;
	}
	const grandPrixId =
		findGrandPrixIdByStageIdFromDatabase(database, currentQuestLive.stageId) ??
		0;
	const grandPrix =
		grandPrixId > 0
			? ensureUserGrandPrixState(userLive, grandPrixId)
			: undefined;
	const completedPlayCount =
		grandPrix === undefined
			? 0
			: getGrandPrixQuestCompletedPlayCount(
					database,
					grandPrix,
					currentQuestLive.stageId,
				);
	return completedPlayCount + (currentQuestLive.startTime.length > 0 ? 1 : 0);
}

function getGrandPrixQuestCompletedPlayCount(
	database: Database,
	grandPrix: ReturnType<typeof ensureUserGrandPrixState>,
	stageId: number,
): number {
	const row = database
		.query<{ grand_prix_series_id: number }, [number]>(
			'SELECT grand_prix_series_id FROM master_grand_prix_quest_stages WHERE id = ?',
		)
		.get(stageId);
	if (row === null) return 0;
	const stageRows = database
		.query<{ id: number }, [number]>(
			[
				'SELECT id',
				'FROM master_grand_prix_quest_stages',
				'WHERE grand_prix_series_id = ?',
			].join(' '),
		)
		.all(row.grand_prix_series_id);
	return stageRows.reduce((sum, stage) => {
		const progress = grandPrix.stageProgressList.find(
			(value) => value.stageId === stage.id,
		);
		return sum + (progress?.playCount ?? 0);
	}, 0);
}
