import type { Database } from 'bun:sqlite';
import { getQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
import type {
	GradeChallengeRuntimeState,
	GradeLiveRuntimeState,
	GrandPrixRuntimeState,
} from '../../server-state-schema.ts';
import { isGrandPrixClosed } from '../../state/grand-prix-runtime-status.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { isQuestStageProgressCompatible } from '../../state/user-quest-progress-compatibility.ts';
import { countClearedStandardQuestStages } from '../../state/user-standard-quest-progress.ts';
import type { QuestTopResponse, QuestTopStatus } from './quest-top-types.ts';

const gradeLiveUnlockStandardQuestClearCount = 30;

export function projectGradeChallengeStatus(
	gradeChallenge: GradeChallengeRuntimeState,
	now: string,
): QuestTopStatus {
	if (gradeChallenge.status <= 0) return 0;
	const nowTime = Date.parse(now);
	return Date.parse(gradeChallenge.startDate) <= nowTime &&
		nowTime < Date.parse(gradeChallenge.endDate)
		? 1
		: 0;
}

export function projectGradeLiveStatus(
	database: Database,
	userLive: UserLiveState,
	gradeLive: GradeLiveRuntimeState,
	now: string,
): QuestTopStatus {
	const clearCount = countClearedStandardQuestStages(userLive, (progress) => {
		const target = getQuestStageIdentityFingerprint(
			database,
			1,
			progress.stageId,
		);
		return (
			target !== undefined && isQuestStageProgressCompatible(progress, target)
		);
	});
	if (
		clearCount < gradeLiveUnlockStandardQuestClearCount ||
		gradeLive.status <= 0
	)
		return 0;
	const nowTime = Date.parse(now);
	return Date.parse(gradeLive.startDate) <= nowTime &&
		nowTime < Date.parse(gradeLive.endDate)
		? 1
		: 0;
}

export function projectGrandPrixQuestTopFields(
	grandPrix: GrandPrixRuntimeState,
): Pick<
	QuestTopResponse,
	| 'grand_prix_open'
	| 'grand_prix_status'
	| 'grand_prix_id'
	| 'grand_prix_start_datetime'
	| 'grand_prix_end_datetime'
> {
	return {
		grand_prix_open: false,
		grand_prix_status: isGrandPrixClosed(grandPrix) ? 0 : 1,
		grand_prix_id: grandPrix.activeGrandPrixId,
		grand_prix_start_datetime: grandPrix.startDate,
		grand_prix_end_datetime: grandPrix.endDate,
	};
}
