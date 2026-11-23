import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import {
	findCompatibleQuestStageProgress,
	isQuestStageProgressCompatible,
} from './user-quest-progress-compatibility.ts';
import type {
	UserQuestProgressStateOwner,
	UserQuestStageProgressState,
} from './user-quest-progress-types.ts';

const standardQuestLiveType = 1;

export function countClearedStandardQuestStages(
	userLive: UserQuestProgressStateOwner,
	isCompatible: (progress: UserQuestStageProgressState) => boolean = () => true,
): number {
	return userLive.questStageProgressList.filter(
		(progress) =>
			progress.questLiveType === standardQuestLiveType &&
			progress.playCount > 0 &&
			isCompatible(progress),
	).length;
}

export function findUserQuestStageProgress(
	userLive: UserQuestProgressStateOwner,
	questLiveType: number,
	stageId: number,
	targetFingerprint?: EntityIdentityFingerprint,
): UserQuestStageProgressState {
	const isSameStage = (progress: UserQuestStageProgressState) =>
		progress.questLiveType === questLiveType && progress.stageId === stageId;
	const existing =
		targetFingerprint === undefined
			? userLive.questStageProgressList.find(isSameStage)
			: findCompatibleQuestStageProgress(
					userLive.questStageProgressList,
					isSameStage,
					targetFingerprint,
				);
	return (
		existing ?? {
			questLiveType,
			stageId,
			highScore: 0,
			playCount: 0,
		}
	);
}

export function recordUserQuestStageResult(
	userLive: UserQuestProgressStateOwner,
	questLiveType: number,
	stageId: number,
	musicId: number,
	score: number,
	provenance?: EntityProvenance,
): UserQuestStageProgressState {
	const before = findUserQuestStageProgress(
		userLive,
		questLiveType,
		stageId,
		provenance?.identityFingerprint,
	);
	const next = {
		questLiveType,
		stageId,
		highScore: Math.max(before.highScore, score),
		bestLoveMusicId:
			score > before.highScore ? musicId : (before.bestLoveMusicId ?? 0),
		playCount: before.playCount + 1,
		...(provenance ?? {}),
	};
	userLive.questStageProgressList = [
		...userLive.questStageProgressList.filter(
			(progress) =>
				progress.questLiveType !== questLiveType ||
				progress.stageId !== stageId ||
				!isQuestStageProgressCompatible(
					progress,
					provenance?.identityFingerprint,
				),
		),
		next,
	];
	return next;
}
