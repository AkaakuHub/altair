import type { UserCurrentQuestLiveState } from '../../state/user-current-quest-live-state.ts';
import {
	findUserDreamLiveProgress,
	recordUserDreamLiveResult,
} from '../../state/user-dream-quest-progress.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	findUserQuestStageProgress,
	recordUserQuestStageResult,
} from '../../state/user-standard-quest-progress.ts';

export function notifyDreamMemberReleaseConfirm() {
	return { body: null, statusCode: 200 };
}

export function getDreamResult(
	database: Database,
	sourceMasterReleaseId: string | undefined,
	currentQuestLive: UserCurrentQuestLiveState,
	userLive: UserLiveState,
) {
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
	const dreamProgressBefore = findUserDreamLiveProgress(
		userLive,
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
	recordUserDreamLiveResult(
		userLive,
		currentQuestLive.stageId,
		identityFingerprint === undefined || sourceMasterReleaseId === undefined
			? undefined
			: { sourceMasterReleaseId, identityFingerprint },
	);
	return {
		body: {
			stage_id: currentQuestLive.stageId,
			quest_live_type: 5,
			is_clear: true,
			result_love: currentQuestLive.score,
			get_card_id: 0,
			music_id: currentQuestLive.musicId,
			play_report: currentQuestLive.playReport,
			first_clear_flag:
				progressBefore.playCount === 0 && dreamProgressBefore.clearTimes === 0,
		},
		statusCode: 200,
	};
}

import type { Database } from 'bun:sqlite';
import { getQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
