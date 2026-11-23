import { describe, expect, test } from 'bun:test';
import { createSelectTicketExchangeReceiptItems } from '../src/state/gacha-select-ticket-receipt.ts';

const userCards = { playerId: 'player-a', userCardDataList: [] };

describe('gacha select ticket receipt', () => {
	test('交換対象cardに含まれないrequestをreceipt生成前に拒否する', () => {
		let templateResolutionCount = 0;
		const receiptItems = createSelectTicketExchangeReceiptItems(
			userCards,
			() => {
				templateResolutionCount += 1;
				return undefined;
			},
			{
				selectTicketExchangeRateId: 1,
				selectTicketSeriesId: 2,
				exchangeItemType: 2,
				exchangeItemId: 1001,
				exchangeItemQuantity: 1,
			},
			[],
			() => undefined,
		);

		expect(receiptItems).toBeUndefined();
		expect(templateResolutionCount).toBe(0);
	});

	test('非card交換を公式receipt fieldへ変換する', () => {
		expect(
			createSelectTicketExchangeReceiptItems(
				userCards,
				() => undefined,
				{
					selectTicketExchangeRateId: 1,
					selectTicketSeriesId: 2,
					exchangeItemType: 3,
					exchangeItemId: 3007001,
					exchangeItemQuantity: 25,
				},
				[],
				() => undefined,
			),
		).toEqual([
			{
				get_id: 3007001,
				get_item_type: 3,
				get_num: 25,
				is_new: false,
			},
		]);
	});
});
