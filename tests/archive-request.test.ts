import { describe, expect, test } from 'bun:test';
import {
	readArchiveGiftRequest,
	readArchiveRankingRequest,
	readArchiveStarsRequest,
} from '../src/v1/route-support/archive-request.ts';

describe('archive request', () => {
	test('gift requestの既存defaultを維持する', () => {
		expect(
			readArchiveGiftRequest({ live_id: 'live', user_item_id: 'item' }),
		).toEqual({ liveId: 'live', userItemId: 'item', useOwnAmount: 0 });
	});
	test('ranking requestの期間とmember defaultを読む', () => {
		expect(readArchiveRankingRequest({ target_period: 'current' })).toEqual({
			targetPeriod: 'current',
			memberId: 0,
		});
	});
	test('stars requestはstring fieldだけを読む', () => {
		expect(
			readArchiveStarsRequest({ present_box_id: 'box', set_star_json: '[]' }),
		).toEqual({ presentBoxId: 'box', setStarJson: '[]' });
	});
});
