import { describe, expect, test } from 'bun:test';
import {
	readGachaGuaranteeExchangeRequest,
	readGachaGuaranteeListRequest,
} from '../src/v1/route-support/gacha-guarantee-request.ts';

describe('gacha guarantee request', () => {
	test('number fieldだけを受理する', () => {
		expect(readGachaGuaranteeListRequest({ gacha_series_id: 10 })).toEqual({
			gachaSeriesId: 10,
		});
		expect(
			readGachaGuaranteeExchangeRequest({ exchange_point_rate_id: '20' }),
		).toEqual({ exchangePointRateId: undefined });
	});
});
