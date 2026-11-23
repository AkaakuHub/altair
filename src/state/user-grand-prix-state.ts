import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';
import { isArrayOf, isRecord } from './json-state-utils.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

export type GrandPrixStageProgressState = {
	stageId: number;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	highScore: number;
	dailyBestScore: number;
	playCount: number;
};

export type UserGrandPrixState = {
	grandPrixId: number;
	stageProgressList: GrandPrixStageProgressState[];
};

type UserGrandPrixStateOwner = {
	grandPrixes: UserGrandPrixState[];
};

export function ensureUserGrandPrixState(
	userLive: UserGrandPrixStateOwner,
	grandPrixId: number,
): UserGrandPrixState {
	const existing = userLive.grandPrixes.find(
		(grandPrix) => grandPrix.grandPrixId === grandPrixId,
	);
	if (existing) {
		return existing;
	}
	const grandPrix = {
		grandPrixId,
		stageProgressList: [],
	};
	userLive.grandPrixes = [...userLive.grandPrixes, grandPrix];
	return grandPrix;
}

export function findGrandPrixStageProgress(
	grandPrix: UserGrandPrixState,
	stageId: number,
	identityFingerprint?: EntityIdentityFingerprint,
): GrandPrixStageProgressState {
	if (identityFingerprint !== undefined) {
		const compatible = findCompatibleMasterBoundProgress(
			grandPrix.stageProgressList,
			(progress) => progress.stageId === stageId,
			identityFingerprint,
		);
		if (compatible !== undefined) return compatible;
	}
	const existing = grandPrix.stageProgressList.find(
		(progress) => progress.stageId === stageId,
	);
	if (existing) {
		return existing;
	}
	return {
		stageId,
		highScore: 0,
		dailyBestScore: 0,
		playCount: 0,
	};
}

export function recordGrandPrixStageResult(
	grandPrix: UserGrandPrixState,
	stageId: number,
	score: number,
	dailyScore: number,
	identityFingerprint?: EntityIdentityFingerprint,
	sourceMasterReleaseId?: string,
): GrandPrixStageProgressState {
	const current = findGrandPrixStageProgress(
		grandPrix,
		stageId,
		identityFingerprint,
	);
	const next = {
		stageId,
		...(sourceMasterReleaseId === undefined ? {} : { sourceMasterReleaseId }),
		...(identityFingerprint === undefined ? {} : { identityFingerprint }),
		highScore: Math.max(current.highScore, score),
		dailyBestScore: Math.max(current.dailyBestScore, dailyScore),
		playCount: current.playCount + 1,
	};
	grandPrix.stageProgressList = [
		...grandPrix.stageProgressList.filter(
			(progress) =>
				progress.stageId !== stageId ||
				(identityFingerprint !== undefined &&
					!isSameEntityIdentity(
						progress.identityFingerprint,
						identityFingerprint,
					)),
		),
		next,
	];
	return next;
}

export function isUserGrandPrixState(
	value: unknown,
): value is UserGrandPrixState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.grandPrixId === 'number' &&
		isArrayOf(value.stageProgressList, isGrandPrixStageProgressState)
	);
}

function isGrandPrixStageProgressState(
	value: unknown,
): value is GrandPrixStageProgressState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.stageId === 'number' &&
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string')) &&
		typeof value.highScore === 'number' &&
		typeof value.dailyBestScore === 'number' &&
		typeof value.playCount === 'number'
	);
}
