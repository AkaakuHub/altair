import { describe, expect, test } from 'bun:test';
import {
	countEarnedArchiveStars,
	countPendingArchivePrizeStars,
	hasArchiveExtraAdmission,
} from '../src/application/archive-prize-progress.ts';
import type { ArchiveGiftPointState } from '../src/state/archive-gift-state.ts';
import type { ArchivePrizeMaster } from '../src/state/archive-prize-definition.ts';

const master: ArchivePrizeMaster = {
	liveId: 'live-1',
	title: 'title',
	liveStartTime: '2026-01-01T00:00:00.000Z',
	characterIds: [101],
	giftStarRewardSegments: [100, 300, 600],
	giftStarsThresholdForExtraAdmission: 2,
};

function createPoint(
	totalUserGiftPoint: number,
	awardedArchivePrizeStarCount = 0,
	allocatedArchivePrizeStarCount = 0,
): ArchiveGiftPointState {
	return {
		playerId: 'player-1',
		liveId: master.liveId,
		totalUserGiftPoint,
		totalUserGiftPointWithoutArchive: 0,
		awardedArchivePrizeStarCount,
		allocatedArchivePrizeStarCount,
	};
}

describe('archive prize progress', () => {
	test('reward segment正本がnullなら獲得starは0である', () => {
		expect(countEarnedArchiveStars(null, 999999)).toBe(0);
	});
	test('threshold以下のsegment数を獲得star数として数える', () => {
		expect(countEarnedArchiveStars(master.giftStarRewardSegments, 299)).toBe(1);
		expect(countEarnedArchiveStars(master.giftStarRewardSegments, 300)).toBe(2);
	});

	test('入場閾値をgift point由来の獲得star数で判定する', () => {
		expect(hasArchiveExtraAdmission(createPoint(299), master)).toBe(false);
		expect(hasArchiveExtraAdmission(createPoint(300), master)).toBe(true);
	});

	test('配分待ちstar数を0未満にしない', () => {
		expect(countPendingArchivePrizeStars(createPoint(0, 3, 1))).toBe(2);
		expect(countPendingArchivePrizeStars(createPoint(0, 1, 3))).toBe(0);
	});
});
