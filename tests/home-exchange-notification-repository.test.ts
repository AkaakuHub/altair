import { describe, expect, test } from 'bun:test';
import { emptyHomeExchangeNotificationRepository } from '../src/v1/route-support/home-exchange-notification-repository.ts';

describe('empty home exchange notification repository', () => {
	test('does not infer unread notifications from exchange availability', () => {
		expect(
			emptyHomeExchangeNotificationRepository.getPendingNotifications('player'),
		).toEqual({
			isNotReadGpPrizeExchangeNewArrival: false,
			isNotReadItemExchangeNewArrival: false,
			isNotReadOnSaleSelectTicketExchangeNewArrival: false,
			isNotReadOutSaleSelectTicketExchangeNewArrival: false,
			isNotReadStickerExchangeNewArrival: false,
			isNotReadSiscaStoreNewArrival: false,
			itemExchangeNewArrivalList: [],
		});
	});
});
