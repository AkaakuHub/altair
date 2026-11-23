import { describe, expect, test } from 'bun:test';
import { ensureUserInventory } from '../src/state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../src/state/user-item-definition.ts';
import {
	addUserItemQuantity,
	consumeUserItems,
	setUserItemQuantity,
} from '../src/state/user-item-mutation.ts';
import {
	createUserItem,
	ensurePositiveItemPickupTime,
} from '../src/state/user-item-provenance.ts';

describe('ensureUserInventory', () => {
	test('在庫が存在しない場合は作成結果を返す', () => {
		const state: { userInventories: UserInventoryState[] } = {
			userInventories: [],
		};

		const result = ensureUserInventory(state, 'player-1', {
			item_category_list: [],
		});

		expect(result.created).toBe(true);
		expect(result.value.playerId).toBe('player-1');
		expect(state.userInventories).toEqual([result.value]);
	});

	test('在庫が存在する場合は同じ在庫を返して作成しない', () => {
		const inventory = { playerId: 'player-1', itemCategoryList: [] };
		const state = { userInventories: [inventory] };

		const result = ensureUserInventory(state, 'player-1', []);

		expect(result).toEqual({ value: inventory, created: false });
		expect(state.userInventories).toEqual([inventory]);
	});
});

describe('user item provenance', () => {
	test('新規itemへmaster release provenanceと正の在庫のpickup timeを記録する', () => {
		const item = createUserItem(
			{
				itemId: 1,
				itemType: 1,
				itemCategory: 2,
				rarity: 3,
				resourceFileName: 'item',
				limitDateTime: null,
			},
			1,
			{
				sourceMasterReleaseId: 'release-1',
				identityFingerprint: { domain: 'item', value: 'fingerprint' },
			},
		);

		expect(item.sourceMasterReleaseId).toBe('release-1');
		expect(item.identityFingerprint).toEqual({
			domain: 'item',
			value: 'fingerprint',
		});
		expect(item.pickupTime).toBeDefined();
	});

	test('異なるidentityの同一item IDへ加算しない', () => {
		const item = createUserItem(
			{
				itemId: 1,
				itemType: 1,
				itemCategory: 2,
				rarity: 3,
				resourceFileName: 'item',
				limitDateTime: null,
			},
			4,
			{
				sourceMasterReleaseId: 'release-1',
				identityFingerprint: { domain: 'item', value: 'old' },
			},
		);
		const state = {
			userInventories: [
				{
					playerId: 'player-1',
					itemCategoryList: [{ itemCategory: 2, userItemList: [item] }],
				},
			],
		};

		expect(() =>
			addUserItemQuantity(
				state,
				'player-1',
				{
					itemId: 1,
					itemType: 1,
					itemCategory: 2,
					rarity: 3,
					resourceFileName: 'item',
					limitDateTime: null,
				},
				2,
				{
					sourceMasterReleaseId: 'release-2',
					identityFingerprint: { domain: 'item', value: 'new' },
				},
			),
		).toThrow('user item identity mismatch: 1');
		expect(item.itemNum).toBe(4);
		expect(item.sourceMasterReleaseId).toBe('release-1');
	});

	test('異なるidentityの同一item IDをmax更新で上書きしない', () => {
		const item = createUserItem(itemDefinition, 4, {
			sourceMasterReleaseId: 'release-1',
			identityFingerprint: { domain: 'item', value: 'old' },
		});
		const inventory = {
			playerId: 'player-1',
			itemCategoryList: [{ itemCategory: 2, userItemList: [item] }],
		};

		expect(() =>
			setUserItemQuantity(inventory, itemDefinition, 99, {
				sourceMasterReleaseId: 'release-2',
				identityFingerprint: { domain: 'item', value: 'new' },
			}),
		).toThrow('user item identity mismatch: 1');
		expect(item.itemNum).toBe(4);
	});

	test('複数素材のidentityまたは合計数量が不正なら一つも消費しない', () => {
		const first = createUserItem(itemDefinition, 3, {
			sourceMasterReleaseId: 'release-1',
			identityFingerprint: { domain: 'item', value: 'first' },
		});
		const second = createUserItem({ ...itemDefinition, itemId: 2 }, 2, {
			sourceMasterReleaseId: 'release-1',
			identityFingerprint: { domain: 'item', value: 'second' },
		});
		const inventory = {
			playerId: 'player-1',
			itemCategoryList: [{ itemCategory: 2, userItemList: [first, second] }],
		};

		expect(
			consumeUserItems(inventory, [
				{
					userItemId: '',
					itemId: 1,
					itemNum: 2,
					provenance: {
						sourceMasterReleaseId: 'release-2',
						identityFingerprint: { domain: 'item', value: 'first' },
					},
				},
				{
					userItemId: '',
					itemId: 2,
					itemNum: 1,
					provenance: {
						sourceMasterReleaseId: 'release-2',
						identityFingerprint: { domain: 'item', value: 'changed' },
					},
				},
			]),
		).toBe(false);
		expect([first.itemNum, second.itemNum]).toEqual([3, 2]);

		expect(
			consumeUserItems(inventory, [
				{
					userItemId: '',
					itemId: 1,
					itemNum: 2,
					provenance: {
						sourceMasterReleaseId: 'release-2',
						identityFingerprint: { domain: 'item', value: 'first' },
					},
				},
				{
					userItemId: '',
					itemId: 1,
					itemNum: 2,
					provenance: {
						sourceMasterReleaseId: 'release-2',
						identityFingerprint: { domain: 'item', value: 'first' },
					},
				},
			]),
		).toBe(false);
		expect(first.itemNum).toBe(3);

		expect(
			consumeUserItems(inventory, [
				{
					userItemId: '',
					itemId: 1,
					itemNum: 2,
					provenance: {
						sourceMasterReleaseId: 'release-2',
						identityFingerprint: { domain: 'item', value: 'first' },
					},
				},
				{
					userItemId: '',
					itemId: 2,
					itemNum: 1,
					provenance: {
						sourceMasterReleaseId: 'release-2',
						identityFingerprint: { domain: 'item', value: 'second' },
					},
				},
			]),
		).toBe(true);
		expect([first.itemNum, second.itemNum]).toEqual([1, 1]);
	});

	test('0個のitemへpickup timeを追加しない', () => {
		const item = createUserItem(
			{
				itemId: 1,
				itemType: 1,
				itemCategory: 2,
				rarity: 3,
				resourceFileName: 'item',
				limitDateTime: null,
			},
			0,
		);
		ensurePositiveItemPickupTime(item);
		expect(item.pickupTime).toBeUndefined();
	});
});

const itemDefinition = {
	itemId: 1,
	itemType: 1,
	itemCategory: 2,
	rarity: 3,
	resourceFileName: 'item',
	limitDateTime: null,
};
