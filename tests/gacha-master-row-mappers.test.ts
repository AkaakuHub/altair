import { describe, expect, test } from 'bun:test';
import {
	mapGachaGuaranteeExchangeRate,
	mapGachaSelectTicketExchangeRate,
} from '../src/master-data/gacha-master-row-mappers.ts';

describe('gacha master row mappers', () => {
	test('guarantee purchase preflightに必要なseries・price・limitを欠落させない', () => {
		expect(
			mapGachaGuaranteeExchangeRate({
				id: 11,
				exchange_point_id: 12,
				exchange_item_type: 2,
				exchange_item_id: 13,
				exchange_item_quantity: 1,
				exchange_price: 200,
				limited_count: 3,
				gacha_series_id: 14,
			}),
		).toEqual({
			exchangePointRateId: 11,
			exchangePointId: 12,
			gachaSeriesId: 14,
			exchangeItemType: 2,
			exchangeItemId: 13,
			exchangeItemQuantity: 1,
			exchangePrice: 200,
			limitedCount: 3,
		});
	});

	test('select ticket exchangeのseriesと付与数を保持する', () => {
		expect(
			mapGachaSelectTicketExchangeRate({
				id: 21,
				select_ticket_series_id: 22,
				exchange_item_type: 2,
				exchange_item_id: 23,
				exchange_item_quantity: 1,
			}),
		).toEqual({
			selectTicketExchangeRateId: 21,
			selectTicketSeriesId: 22,
			exchangeItemType: 2,
			exchangeItemId: 23,
			exchangeItemQuantity: 1,
		});
	});
});
