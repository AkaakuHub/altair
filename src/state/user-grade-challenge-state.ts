import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import { isRecord } from './json-state-utils.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

export type UserGradeChallengeStageProgressState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	gradeChalSeasonId: number;
	stageId: number;
	musicId: number;
	highScore: number;
	playCount: number;
	playReport: string;
};

export type UserGradeChallengeSeasonProgressState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	gradeChalSeasonId: number;
	seasonGradePoint: number;
};

type UserGradeChallengeStateOwner = {
	gradeChallengeProgressList: UserGradeChallengeStageProgressState[];
	gradeChallengeSeasonProgressList: UserGradeChallengeSeasonProgressState[];
};

export function findUserGradeChallengeStageProgress(
	userLive: UserGradeChallengeStateOwner,
	gradeChalSeasonId: number,
	stageId: number,
	identityFingerprint: EntityIdentityFingerprint,
): UserGradeChallengeStageProgressState {
	const existing = findCompatibleMasterBoundProgress(
		userLive.gradeChallengeProgressList,
		(progress) =>
			progress.gradeChalSeasonId === gradeChalSeasonId &&
			progress.stageId === stageId,
		identityFingerprint,
	);
	if (existing) {
		return existing;
	}
	return {
		gradeChalSeasonId,
		stageId,
		musicId: 0,
		highScore: 0,
		playCount: 0,
		playReport: '',
	};
}

export function recordUserGradeChallengeStageResult(
	userLive: UserGradeChallengeStateOwner,
	gradeChalSeasonId: number,
	stageId: number,
	musicId: number,
	score: number,
	playReport: string,
	provenance: EntityProvenance,
): UserGradeChallengeStageProgressState {
	const before = findUserGradeChallengeStageProgress(
		userLive,
		gradeChalSeasonId,
		stageId,
		provenance.identityFingerprint,
	);
	const next = {
		sourceMasterReleaseId: provenance.sourceMasterReleaseId,
		identityFingerprint: provenance.identityFingerprint,
		gradeChalSeasonId,
		stageId,
		musicId,
		highScore: Math.max(before.highScore, score),
		playCount: before.playCount + 1,
		playReport: score >= before.highScore ? playReport : before.playReport,
	};
	userLive.gradeChallengeProgressList = [
		...userLive.gradeChallengeProgressList.filter(
			(progress) =>
				progress.gradeChalSeasonId !== gradeChalSeasonId ||
				progress.stageId !== stageId ||
				progress.identityFingerprint?.domain !==
					provenance.identityFingerprint.domain ||
				progress.identityFingerprint.value !==
					provenance.identityFingerprint.value,
		),
		next,
	].sort(
		(left, right) =>
			left.gradeChalSeasonId - right.gradeChalSeasonId ||
			left.stageId - right.stageId,
	);
	return next;
}

export function findUserGradeChallengeSeasonProgress(
	userLive: UserGradeChallengeStateOwner,
	gradeChalSeasonId: number,
	identityFingerprint: EntityIdentityFingerprint,
): UserGradeChallengeSeasonProgressState {
	const existing = findCompatibleMasterBoundProgress(
		userLive.gradeChallengeSeasonProgressList,
		(progress) => progress.gradeChalSeasonId === gradeChalSeasonId,
		identityFingerprint,
	);
	if (existing) {
		return existing;
	}
	return {
		gradeChalSeasonId,
		seasonGradePoint: 0,
	};
}

export function addUserGradeChallengeSeasonGradePoint(
	userLive: UserGradeChallengeStateOwner,
	gradeChalSeasonId: number,
	addGradePoint: number,
	provenance: EntityProvenance,
): UserGradeChallengeSeasonProgressState {
	const current = findUserGradeChallengeSeasonProgress(
		userLive,
		gradeChalSeasonId,
		provenance.identityFingerprint,
	);
	const next = {
		sourceMasterReleaseId: provenance.sourceMasterReleaseId,
		identityFingerprint: provenance.identityFingerprint,
		gradeChalSeasonId,
		seasonGradePoint: current.seasonGradePoint + addGradePoint,
	};
	userLive.gradeChallengeSeasonProgressList = [
		...userLive.gradeChallengeSeasonProgressList.filter(
			(progress) =>
				progress.gradeChalSeasonId !== gradeChalSeasonId ||
				progress.identityFingerprint?.domain !==
					provenance.identityFingerprint.domain ||
				progress.identityFingerprint.value !==
					provenance.identityFingerprint.value,
		),
		next,
	].sort((left, right) => left.gradeChalSeasonId - right.gradeChalSeasonId);
	return next;
}

export function isUserGradeChallengeStageProgressState(
	value: unknown,
): value is UserGradeChallengeStageProgressState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			isEntityIdentityFingerprint(value.identityFingerprint)) &&
		typeof value.gradeChalSeasonId === 'number' &&
		typeof value.stageId === 'number' &&
		typeof value.musicId === 'number' &&
		typeof value.highScore === 'number' &&
		typeof value.playCount === 'number' &&
		typeof value.playReport === 'string'
	);
}

export function isUserGradeChallengeSeasonProgressState(
	value: unknown,
): value is UserGradeChallengeSeasonProgressState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			isEntityIdentityFingerprint(value.identityFingerprint)) &&
		typeof value.gradeChalSeasonId === 'number' &&
		typeof value.seasonGradePoint === 'number'
	);
}

function isEntityIdentityFingerprint(
	value: unknown,
): value is EntityIdentityFingerprint {
	return (
		isRecord(value) &&
		typeof value.domain === 'string' &&
		typeof value.value === 'string'
	);
}
