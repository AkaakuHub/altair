import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';
import { isRecord } from './json-state-utils.ts';

export type ArchiveGiftPointState = {
	playerId: string;
	liveId: string;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	totalUserGiftPoint: number;
	totalUserGiftPointWithoutArchive: number;
	awardedArchivePrizeStarCount: number;
	allocatedArchivePrizeStarCount: number;
};

type ArchiveGiftPointResult = {
	giftPoints: ArchiveGiftPointState[];
	point: ArchiveGiftPointState;
	previousTotalUserGiftPoint: number;
};

export function addArchiveGiftPoint(
	giftPoints: ArchiveGiftPointState[],
	playerId: string,
	liveId: string,
	userGiftPoint: number,
	isArchive: boolean,
	provenance: EntityProvenance,
): ArchiveGiftPointResult {
	const existing = giftPoints.find(
		(point) =>
			point.playerId === playerId &&
			point.liveId === liveId &&
			isSameEntityIdentity(
				point.identityFingerprint,
				provenance.identityFingerprint,
			),
	);
	if (existing) {
		const previousTotalUserGiftPoint = existing.totalUserGiftPoint;
		existing.totalUserGiftPoint += userGiftPoint;
		existing.totalUserGiftPointWithoutArchive =
			readTotalUserGiftPointWithoutArchive(existing) +
			(isArchive ? 0 : userGiftPoint);
		existing.awardedArchivePrizeStarCount =
			readAwardedArchivePrizeStarCount(existing);
		existing.allocatedArchivePrizeStarCount =
			readAllocatedArchivePrizeStarCount(existing);
		return {
			giftPoints,
			point: existing,
			previousTotalUserGiftPoint,
		};
	}
	const legacy = giftPoints.find(
		(point) =>
			point.playerId === playerId &&
			point.liveId === liveId &&
			point.identityFingerprint === undefined,
	);
	const previousTotalUserGiftPoint = legacy?.totalUserGiftPoint ?? 0;
	const previousTotalUserGiftPointWithoutArchive = legacy
		? readTotalUserGiftPointWithoutArchive(legacy)
		: 0;
	const point = {
		playerId,
		liveId,
		totalUserGiftPoint: previousTotalUserGiftPoint + userGiftPoint,
		totalUserGiftPointWithoutArchive:
			previousTotalUserGiftPointWithoutArchive +
			(isArchive ? 0 : userGiftPoint),
		awardedArchivePrizeStarCount: legacy
			? readAwardedArchivePrizeStarCount(legacy)
			: 0,
		allocatedArchivePrizeStarCount: legacy
			? readAllocatedArchivePrizeStarCount(legacy)
			: 0,
		...provenance,
	};
	return {
		giftPoints: [...giftPoints, point],
		point,
		previousTotalUserGiftPoint,
	};
}

export function addAwardedArchivePrizeStars(
	point: ArchiveGiftPointState,
	starCount: number,
): void {
	if (!Number.isSafeInteger(starCount) || starCount <= 0) {
		return;
	}
	point.awardedArchivePrizeStarCount =
		readAwardedArchivePrizeStarCount(point) + starCount;
}

export function addAllocatedArchivePrizeStars(
	point: ArchiveGiftPointState,
	starCount: number,
): void {
	if (!Number.isSafeInteger(starCount) || starCount <= 0) {
		return;
	}
	point.allocatedArchivePrizeStarCount =
		readAllocatedArchivePrizeStarCount(point) + starCount;
}

export function findArchiveGiftPoint(
	giftPoints: readonly ArchiveGiftPointState[],
	playerId: string,
	liveId: string,
	targetFingerprint?: EntityIdentityFingerprint,
): ArchiveGiftPointState | undefined {
	const sameLive = giftPoints.filter(
		(giftPoint) =>
			giftPoint.playerId === playerId && giftPoint.liveId === liveId,
	);
	if (targetFingerprint !== undefined) {
		const exact = sameLive.find(
			(giftPoint) =>
				giftPoint.identityFingerprint !== undefined &&
				isSameEntityIdentity(giftPoint.identityFingerprint, targetFingerprint),
		);
		if (exact !== undefined) return exact;
	}
	return sameLive.find(
		(giftPoint) => giftPoint.identityFingerprint === undefined,
	);
}

export function setArchiveGiftPoint(
	giftPoints: ArchiveGiftPointState[],
	nextPoint: ArchiveGiftPointState,
): ArchiveGiftPointState[] {
	const existing = giftPoints.find(
		(giftPoint) =>
			giftPoint.playerId === nextPoint.playerId &&
			giftPoint.liveId === nextPoint.liveId &&
			giftPoint.identityFingerprint?.domain ===
				nextPoint.identityFingerprint?.domain &&
			giftPoint.identityFingerprint?.value ===
				nextPoint.identityFingerprint?.value,
	);
	if (!existing) {
		return [...giftPoints, nextPoint];
	}
	existing.totalUserGiftPoint = nextPoint.totalUserGiftPoint;
	existing.totalUserGiftPointWithoutArchive =
		nextPoint.totalUserGiftPointWithoutArchive;
	existing.awardedArchivePrizeStarCount =
		nextPoint.awardedArchivePrizeStarCount;
	existing.allocatedArchivePrizeStarCount =
		nextPoint.allocatedArchivePrizeStarCount;
	return giftPoints;
}

export function getArchiveGiftPointWithDefaults(
	point: ArchiveGiftPointState,
): ArchiveGiftPointState {
	return {
		playerId: point.playerId,
		liveId: point.liveId,
		...(point.sourceMasterReleaseId === undefined
			? {}
			: { sourceMasterReleaseId: point.sourceMasterReleaseId }),
		...(point.identityFingerprint === undefined
			? {}
			: { identityFingerprint: point.identityFingerprint }),
		totalUserGiftPoint: point.totalUserGiftPoint,
		totalUserGiftPointWithoutArchive:
			readTotalUserGiftPointWithoutArchive(point),
		awardedArchivePrizeStarCount: readAwardedArchivePrizeStarCount(point),
		allocatedArchivePrizeStarCount: readAllocatedArchivePrizeStarCount(point),
	};
}

function readTotalUserGiftPointWithoutArchive(
	point: ArchiveGiftPointState,
): number {
	return typeof point.totalUserGiftPointWithoutArchive === 'number'
		? point.totalUserGiftPointWithoutArchive
		: 0;
}

function readAwardedArchivePrizeStarCount(
	point: ArchiveGiftPointState,
): number {
	return typeof point.awardedArchivePrizeStarCount === 'number'
		? point.awardedArchivePrizeStarCount
		: 0;
}

function readAllocatedArchivePrizeStarCount(
	point: ArchiveGiftPointState,
): number {
	return typeof point.allocatedArchivePrizeStarCount === 'number'
		? point.allocatedArchivePrizeStarCount
		: 0;
}

export function isArchiveGiftPointState(
	value: unknown,
): value is ArchiveGiftPointState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		typeof value.liveId === 'string' &&
		typeof value.totalUserGiftPoint === 'number' &&
		(value.totalUserGiftPointWithoutArchive === undefined ||
			typeof value.totalUserGiftPointWithoutArchive === 'number') &&
		(value.awardedArchivePrizeStarCount === undefined ||
			typeof value.awardedArchivePrizeStarCount === 'number') &&
		(value.allocatedArchivePrizeStarCount === undefined ||
			typeof value.allocatedArchivePrizeStarCount === 'number') &&
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string'))
	);
}
