import { describe, expect, test } from 'bun:test';
import {
	addArchiveGiftPoint,
	findArchiveGiftPoint,
} from '../src/state/archive-gift-state.ts';

const liveA = { domain: 'withlive-archive', value: 'content-a' };
const liveB = { domain: 'withlive-archive', value: 'content-b' };

describe('archive gift point version round trip', () => {
	test('同じlive IDの異なるidentityへgift pointとprize進捗を別々に保持する', () => {
		let points = addArchiveGiftPoint([], 'player', 'live-1', 100, true, {
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: liveA,
		}).giftPoints;
		points = addArchiveGiftPoint(points, 'player', 'live-1', 200, true, {
			sourceMasterReleaseId: 'release-b',
			identityFingerprint: liveB,
		}).giftPoints;

		expect(points).toHaveLength(2);
		expect(
			findArchiveGiftPoint(points, 'player', 'live-1', liveA)
				?.totalUserGiftPoint,
		).toBe(100);
		expect(
			findArchiveGiftPoint(points, 'player', 'live-1', liveB)
				?.totalUserGiftPoint,
		).toBe(200);
	});

	test('legacy pointを推測変換せず、初回version付き更新の基準として保持する', () => {
		const legacy = {
			playerId: 'player',
			liveId: 'live-1',
			totalUserGiftPoint: 50,
			totalUserGiftPointWithoutArchive: 10,
			awardedArchivePrizeStarCount: 1,
			allocatedArchivePrizeStarCount: 1,
		};
		const result = addArchiveGiftPoint([legacy], 'player', 'live-1', 25, true, {
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: liveA,
		});

		expect(result.giftPoints).toHaveLength(2);
		expect(result.giftPoints[0]).toEqual(legacy);
		expect(
			findArchiveGiftPoint(result.giftPoints, 'player', 'live-1', liveA),
		).toMatchObject({
			totalUserGiftPoint: 75,
			awardedArchivePrizeStarCount: 1,
			allocatedArchivePrizeStarCount: 1,
			sourceMasterReleaseId: 'release-a',
		});
	});
});
