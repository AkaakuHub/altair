import { describe, expect, test } from 'bun:test';
import type { UserInventoryState } from '../src/state/user-item-definition.ts';
import { migrateUserInventoryState } from '../src/state-migrations/user-inventory-state-migration.ts';

describe('user inventory state migration', () => {
	test('legacy itemのcategoryとpickup timeを起動時に補完する', () => {
		const inventory: UserInventoryState = {
			playerId: 'player-1',
			itemCategoryList: [
				{
					itemCategory: 4,
					userItemList: [
						{
							userItemId: 'item-1',
							itemId: 10,
							itemNum: 1,
							itemType: 4,
							limitDateTime: null,
							rarity: 1,
							resourceFileName: '',
						},
					],
				},
			],
		};

		migrateUserInventoryState(inventory);

		expect(inventory.itemCategoryList[0]?.userItemList[0]).toMatchObject({
			itemCategory: 4,
			pickupTime: expect.any(String),
		});
	});
});
