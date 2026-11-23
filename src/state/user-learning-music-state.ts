import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import { isRecord } from './json-state-utils.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

export type UserLearningMusicMasteryState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	musicId: number;
	musicExpLevel: number;
	earnedMusicExp: number;
	isMastery: boolean;
};

export type UserLearningMusicStateOwner = {
	learningMusicMasteries: UserLearningMusicMasteryState[];
};

export function ensureUserLearningMusicMastery(
	userLive: UserLearningMusicStateOwner,
	seed: UserLearningMusicMasteryState,
	provenance: EntityProvenance,
): UserLearningMusicMasteryState {
	const existing = findCompatibleMasterBoundProgress(
		userLive.learningMusicMasteries,
		(mastery) => mastery.musicId === seed.musicId,
		provenance.identityFingerprint,
	);
	if (existing) {
		return existing;
	}
	const next = { ...seed, ...provenance };
	userLive.learningMusicMasteries = [...userLive.learningMusicMasteries, next];
	return next;
}

export function saveUserLearningMusicMastery(
	userLive: UserLearningMusicStateOwner,
	mastery: UserLearningMusicMasteryState,
	provenance: EntityProvenance,
): void {
	const next = { ...mastery, ...provenance };
	userLive.learningMusicMasteries = [
		...userLive.learningMusicMasteries.filter(
			(current) =>
				current.musicId !== mastery.musicId ||
				current.identityFingerprint?.domain !==
					provenance.identityFingerprint.domain ||
				current.identityFingerprint.value !==
					provenance.identityFingerprint.value,
		),
		next,
	];
}

export function ensureLegacyUserLearningMusicMastery(
	userLive: UserLearningMusicStateOwner,
	seed: UserLearningMusicMasteryState,
): UserLearningMusicMasteryState {
	const existing = userLive.learningMusicMasteries.find(
		(mastery) =>
			mastery.musicId === seed.musicId &&
			mastery.identityFingerprint === undefined,
	);
	if (existing !== undefined) {
		return existing;
	}
	userLive.learningMusicMasteries = [...userLive.learningMusicMasteries, seed];
	return seed;
}

export function saveLegacyUserLearningMusicMastery(
	userLive: UserLearningMusicStateOwner,
	mastery: UserLearningMusicMasteryState,
): void {
	userLive.learningMusicMasteries = [
		...userLive.learningMusicMasteries.filter(
			(current) =>
				current.musicId !== mastery.musicId ||
				current.identityFingerprint !== undefined,
		),
		{
			musicId: mastery.musicId,
			musicExpLevel: mastery.musicExpLevel,
			earnedMusicExp: mastery.earnedMusicExp,
			isMastery: mastery.isMastery,
		},
	];
}

export function isUserLearningMusicMasteryState(
	value: unknown,
): value is UserLearningMusicMasteryState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string')) &&
		typeof value.musicId === 'number' &&
		typeof value.musicExpLevel === 'number' &&
		typeof value.earnedMusicExp === 'number' &&
		typeof value.isMastery === 'boolean'
	);
}
