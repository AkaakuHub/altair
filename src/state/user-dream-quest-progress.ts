import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import {
	findCompatibleQuestStageProgress,
	isQuestStageProgressCompatible,
} from './user-quest-progress-compatibility.ts';
import type {
	UserDreamLiveProgressState,
	UserQuestProgressStateOwner,
} from './user-quest-progress-types.ts';

export function findUserDreamLiveProgress(
	userLive: UserQuestProgressStateOwner,
	stageId: number,
	targetFingerprint?: EntityIdentityFingerprint,
): UserDreamLiveProgressState {
	const isSameStage = (progress: UserDreamLiveProgressState) =>
		progress.stageId === stageId;
	const existing =
		targetFingerprint === undefined
			? userLive.dreamLiveProgressList.find(isSameStage)
			: findCompatibleQuestStageProgress(
					userLive.dreamLiveProgressList,
					isSameStage,
					targetFingerprint,
				);
	return (
		existing ?? {
			stageId,
			clearTimes: 0,
			isGetCard: false,
			limitBreakTimes: 0,
		}
	);
}

export function recordUserDreamLiveResult(
	userLive: UserQuestProgressStateOwner,
	stageId: number,
	provenance?: EntityProvenance,
): UserDreamLiveProgressState {
	const current = findUserDreamLiveProgress(
		userLive,
		stageId,
		provenance?.identityFingerprint,
	);
	const next = {
		stageId,
		clearTimes: current.clearTimes + 1,
		isGetCard: current.isGetCard,
		limitBreakTimes: current.limitBreakTimes,
		...(provenance ?? {}),
	};
	userLive.dreamLiveProgressList = [
		...userLive.dreamLiveProgressList.filter(
			(progress) =>
				progress.stageId !== stageId ||
				!isQuestStageProgressCompatible(
					progress,
					provenance?.identityFingerprint,
				),
		),
		next,
	].sort((left, right) => left.stageId - right.stageId);
	return next;
}
