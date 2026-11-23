import { describe, expect, test } from 'bun:test';
import {
	findUserShopExchange,
	hasUserItem,
} from '../src/v1/route-support/shop-notification-user-state.ts';

describe('shop notification user state', () => {
	test('reads item affordability and the selected player exchange state', () => {
		const inventory = {
			playerId: 'player-1',
			itemCategoryList: [
				{
					itemCategory: 1,
					userItemList: [
						{
							userItemId: 'item-1',
							itemId: 100,
							itemNum: 3,
							itemType: 1,
							limitDateTime: null,
							rarity: 1,
							resourceFileName: 'item-100',
						},
					],
				},
			],
		};
		expect(hasUserItem(inventory, 100, 3)).toBe(true);
		expect(hasUserItem(inventory, 100, 4)).toBe(false);

		const exchange = {
			playerId: 'player-1',
			shopList: [],
			petalExchangePurchaseList: [],
			gpPrizeExchangeList: [],
			itemExchangeList: [],
		};
		expect(
			findUserShopExchange({ userShopExchanges: [exchange] }, 'player-1'),
		).toBe(exchange);
		expect(
			findUserShopExchange({ userShopExchanges: [exchange] }, 'player-2'),
		).toBeUndefined();
	});
});
