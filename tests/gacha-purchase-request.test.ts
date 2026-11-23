import { describe, expect, test } from 'bun:test';
import { parseGachaPurchaseRequest } from '../src/v1/route-support/gacha-purchase-request.ts';

describe('gacha purchase request', () => {
	test('公式fieldだけを数値として読む', () => {
		expect(
			parseGachaPurchaseRequest({
				gacha_series_id: 10,
				gacha_set_purchase_type: 2,
			}),
		).toEqual({
			gachaSeriesId: 10,
			gachaSetPurchaseType: 2,
		});
		expect(parseGachaPurchaseRequest({ gacha_series_id: '10' })).toEqual({
			gachaSeriesId: undefined,
			gachaSetPurchaseType: undefined,
		});
	});
});
