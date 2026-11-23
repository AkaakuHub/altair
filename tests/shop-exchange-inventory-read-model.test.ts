import { describe, expect, test } from 'bun:test';
import type { UserInventoryState } from '../src/state/user-item-definition.ts';
import {
	aggregateLimitBreakMaterialNumByRarity,
	getInventoryItemNum,
	isHavingGpPrizeExchange,
} from '../src/v1/responses/shop-exchange-inventory-read-model.ts';

const inventory: UserInventoryState = {
	playerId: 'player-1',
	itemCategoryList: [
		{
			itemCategory: 1,
			userItemList: [
				{
					userItemId: 'item-10',
					itemId: 10,
					itemNum: 3,
					itemType: 1,
					itemCategory: 1,
					limitDateTime: null,
					rarity: 1,
					resourceFileName: 'item-10',
				},
				{
					userItemId: 'item-11',
					itemId: 11,
					itemNum: 4,
					itemType: 1,
					itemCategory: 1,
					limitDateTime: null,
					rarity: 1,
					resourceFileName: 'item-11',
				},
			],
		},
	],
};

describe('shop exchange inventory read model', () => {
	test('投影済みinventoryに存在するitemだけ数量を返す', () => {
		expect(getInventoryItemNum(inventory, 10)).toBe(3);
		expect(getInventoryItemNum(inventory, 99)).toBe(0);
		expect(getInventoryItemNum(undefined, 10)).toBe(0);
		expect(getInventoryItemNum(inventory, undefined)).toBe(0);
	});

	test('正の所持数だけをrarity単位で合算する', () => {
		expect(
			aggregateLimitBreakMaterialNumByRarity(
				[
					{ rarity: 2, itemId: 10 },
					{ rarity: 2, itemId: 11 },
					{ rarity: 3, itemId: 99 },
				],
				inventory,
			),
		).toEqual(new Map([[2, 7]]));
	});

	test('card以外の景品では永続stateの所持判定を維持する', () => {
		expect(
			isHavingGpPrizeExchange(
				true,
				{
					gpPrizeExchangesId: 1,
					productItemType: 1,
					productItemId: 10,
				},
				undefined,
				undefined,
			),
		).toBe(true);
	});
});
