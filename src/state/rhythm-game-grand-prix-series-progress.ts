import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';
import type {
	UserRhythmGameGrandPrixContainer,
	UserRhythmGameGrandPrixSeriesProgressState,
	UserRhythmGameGrandPrixState,
} from './rhythm-game-grand-prix-types.ts';

export function ensureUserRhythmGameGrandPrixState(
	userLive: UserRhythmGameGrandPrixContainer,
	grandPrixId: number,
): UserRhythmGameGrandPrixState {
	const existing = userLive.rhythmGameGrandPrixes.find(
		(grandPrix) => grandPrix.grandPrixId === grandPrixId,
	);
	if (existing) return existing;
	const grandPrix = { grandPrixId, seriesProgressList: [] };
	userLive.rhythmGameGrandPrixes = [
		...userLive.rhythmGameGrandPrixes,
		grandPrix,
	];
	return grandPrix;
}

export function findRhythmGameGrandPrixSeriesProgress(
	grandPrix: UserRhythmGameGrandPrixState,
	seriesId: number,
	identityFingerprint?: EntityIdentityFingerprint,
	sourceMasterReleaseId?: string,
): UserRhythmGameGrandPrixSeriesProgressState {
	if (identityFingerprint !== undefined) {
		const compatible = findCompatibleMasterBoundProgress(
			grandPrix.seriesProgressList,
			(progress) => progress.grandPrixRhythmGameSeriesId === seriesId,
			identityFingerprint,
		);
		if (compatible !== undefined) return compatible;
	} else {
		const existing = grandPrix.seriesProgressList.find(
			(progress) => progress.grandPrixRhythmGameSeriesId === seriesId,
		);
		if (existing !== undefined) return existing;
	}
	return {
		grandPrixRhythmGameSeriesId: seriesId,
		...(sourceMasterReleaseId === undefined ? {} : { sourceMasterReleaseId }),
		...(identityFingerprint === undefined ? {} : { identityFingerprint }),
		highScore: 0,
		currentDailyPoint: 0,
		playCount: 0,
		deckCardList: [],
	};
}

export function saveRhythmGameGrandPrixSeriesProgress(
	grandPrix: UserRhythmGameGrandPrixState,
	progress: UserRhythmGameGrandPrixSeriesProgressState,
): void {
	grandPrix.seriesProgressList = [
		...grandPrix.seriesProgressList.filter(
			(current) => !isSameProgressIdentity(current, progress),
		),
		progress,
	].sort(
		(left, right) =>
			left.grandPrixRhythmGameSeriesId - right.grandPrixRhythmGameSeriesId,
	);
}

export function recordRhythmGameGrandPrixSeriesResult(
	grandPrix: UserRhythmGameGrandPrixState,
	seriesId: number,
	score: number,
	point: number,
	identityFingerprint?: EntityIdentityFingerprint,
	sourceMasterReleaseId?: string,
): void {
	const current = findRhythmGameGrandPrixSeriesProgress(
		grandPrix,
		seriesId,
		identityFingerprint,
		sourceMasterReleaseId,
	);
	saveRhythmGameGrandPrixSeriesProgress(grandPrix, {
		grandPrixRhythmGameSeriesId: seriesId,
		...(sourceMasterReleaseId === undefined ? {} : { sourceMasterReleaseId }),
		...(identityFingerprint === undefined ? {} : { identityFingerprint }),
		highScore: Math.max(current.highScore, score),
		currentDailyPoint: Math.max(current.currentDailyPoint, point),
		playCount: current.playCount + 1,
		deckCardList: current.deckCardList,
	});
}

function isSameProgressIdentity(
	current: UserRhythmGameGrandPrixSeriesProgressState,
	progress: UserRhythmGameGrandPrixSeriesProgressState,
): boolean {
	if (
		current.grandPrixRhythmGameSeriesId !== progress.grandPrixRhythmGameSeriesId
	)
		return false;
	if (progress.identityFingerprint === undefined)
		return current.identityFingerprint === undefined;
	return isSameEntityIdentity(
		current.identityFingerprint,
		progress.identityFingerprint,
	);
}
