import {
	type ArchiveGiftPointState,
	getArchiveGiftPointWithDefaults,
} from '../state/archive-gift-state.ts';
import type { ArchivePrizeMaster } from '../state/archive-prize-definition.ts';

export function hasArchiveExtraAdmission(
	point: ArchiveGiftPointState | undefined,
	master: ArchivePrizeMaster | undefined,
): boolean {
	if (!point || !master || master.giftStarsThresholdForExtraAdmission <= 0) {
		return false;
	}
	return (
		(getEarnedArchivePrizeStarCount(point, master) ?? 0) >=
		master.giftStarsThresholdForExtraAdmission
	);
}

export function getEarnedArchivePrizeStarCount(
	point: ArchiveGiftPointState | undefined,
	master: ArchivePrizeMaster | undefined,
): number | undefined {
	if (!point || !master) {
		return undefined;
	}
	return countEarnedArchiveStars(
		master.giftStarRewardSegments,
		getArchiveGiftPointWithDefaults(point).totalUserGiftPoint,
	);
}

export function countEarnedArchiveStars(
	segments: readonly number[] | null,
	totalUserGiftPoint: number,
): number {
	if (segments === null) return 0;
	return segments.filter((segment) => totalUserGiftPoint >= segment).length;
}

export function countPendingArchivePrizeStars(
	point: ArchiveGiftPointState,
): number {
	return Math.max(
		0,
		point.awardedArchivePrizeStarCount - point.allocatedArchivePrizeStarCount,
	);
}

export function getAllocatedArchivePrizeStarCount(
	point: ArchiveGiftPointState | undefined,
): number {
	return point
		? getArchiveGiftPointWithDefaults(point).allocatedArchivePrizeStarCount
		: 0;
}
