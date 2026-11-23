import type { Database } from 'bun:sqlite';
import { getQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
import type { UserCurrentQuestLiveState } from '../../state/user-current-quest-live-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	findUserQuestStageProgress,
	recordUserQuestStageResult,
} from '../../state/user-standard-quest-progress.ts';
import { lookupGainStylePointFromDatabase } from './quest-stage-data.ts';

export function getQuestResult(
	database: Database,
	sourceMasterReleaseId: string | undefined,
	currentQuestLive: UserCurrentQuestLiveState,
	userLive: UserLiveState,
) {
	const gainedStylePoint = currentQuestLive.stageId
		? lookupGainStylePointFromDatabase(database, currentQuestLive.stageId)
		: 0;
	const identityFingerprint = getQuestStageIdentityFingerprint(
		database,
		currentQuestLive.questLiveType,
		currentQuestLive.stageId,
	);
	const progressBefore = findUserQuestStageProgress(
		userLive,
		currentQuestLive.questLiveType,
		currentQuestLive.stageId,
		identityFingerprint,
	);
	recordUserQuestStageResult(
		userLive,
		currentQuestLive.questLiveType,
		currentQuestLive.stageId,
		currentQuestLive.musicId,
		currentQuestLive.score,
		identityFingerprint === undefined || sourceMasterReleaseId === undefined
			? undefined
			: { sourceMasterReleaseId, identityFingerprint },
	);
	return {
		body: {
			quest_live_type: currentQuestLive.questLiveType,
			stage_id: currentQuestLive.stageId,
			quest_result: true,
			result_love: currentQuestLive.score,
			best_love: Math.max(currentQuestLive.score, progressBefore.highScore),
			before_best_love: progressBefore.highScore,
			add_style_point: gainedStylePoint,
			is_challenge_mode: currentQuestLive.isChallengeMode,
			music_id: currentQuestLive.musicId,
			reward_list: [] satisfies [],
			play_report: currentQuestLive.playReport,
			mastary_level_before: 1,
			mastary_level_after: 1,
			mastary_level_experience: 0,
			mastary_level_total_experience_before: 0,
			first_clear_flag: progressBefore.playCount === 0,
			first_complete_clear_flag: progressBefore.playCount === 0,
			is_limit_over_style_point: false,
		},
		statusCode: 200,
	};
}
