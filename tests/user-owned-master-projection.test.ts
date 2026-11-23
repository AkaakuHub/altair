import { describe, expect, test } from 'bun:test';
import {
	getProjectedUserCardDataIds,
	projectUserCards,
	projectUserInventory,
} from '../src/application/user-owned-master-projection.ts';
import type { UserCardCollectionState } from '../src/state/user-card-aggregate-state.ts';
import type { UserInventoryState } from '../src/state/user-item-definition.ts';

describe('user-owned master projection', () => {
	test('projects items without clamping or deleting the canonical quantity', () => {
		const canonical: UserInventoryState = {
			playerId: 'player',
			itemCategoryList: [
				{
					itemCategory: 1,
					userItemList: [createItem(10, 999), createItem(20, 2)],
				},
			],
		};
		const projected = projectUserInventory(canonical, {
			hasItem: (itemId) => itemId === 20,
			getItemFingerprint: () => undefined,
		});

		expect(projected.itemCategoryList[0]?.userItemList).toEqual([
			createItem(20, 2),
		]);
		expect(canonical.itemCategoryList[0]?.userItemList).toEqual([
			createItem(10, 999),
			createItem(20, 2),
		]);
	});

	test('restores a card when the selected master supports its definition', () => {
		const canonical = {
			playerId: 'player',
			userCardDataList: [
				{ card_datas_id: 10, d_card_datas_id: 'card-10' },
				{ card_datas_id: 20, d_card_datas_id: 'card-20' },
			],
		} as UserCardCollectionState;
		const oldMaster = projectUserCards(canonical, {
			hasCard: (cardDatasId) => cardDatasId === 10,
			getCardFingerprint: () => undefined,
		});
		const newMasterAgain = projectUserCards(canonical, {
			hasCard: () => true,
			getCardFingerprint: () => undefined,
		});

		expect(oldMaster.userCardDataList.map(readCardDatasId)).toEqual([10]);
		expect([...getProjectedUserCardDataIds(oldMaster)]).toEqual(['card-10']);
		expect(newMasterAgain.userCardDataList.map(readCardDatasId)).toEqual([
			10, 20,
		]);
		expect(canonical.userCardDataList.map(readCardDatasId)).toEqual([10, 20]);
	});

	test('同じIDでもfingerprintが異なるcardを別versionでは表示しない', () => {
		const canonical = {
			playerId: 'player',
			userCardDataList: [
				{
					card_datas_id: 10,
					d_card_datas_id: 'card-10',
					identity_fingerprint: { domain: 'card', value: 'original' },
				},
			],
		} as UserCardCollectionState;
		const changed = projectUserCards(canonical, {
			hasCard: () => true,
			getCardFingerprint: () => ({ domain: 'card', value: 'changed' }),
		});
		const original = projectUserCards(canonical, {
			hasCard: () => true,
			getCardFingerprint: () => ({ domain: 'card', value: 'original' }),
		});

		expect(changed.userCardDataList).toEqual([]);
		expect(original.userCardDataList).toHaveLength(1);
		expect(canonical.userCardDataList).toHaveLength(1);
	});

	test('同じIDでもfingerprintが異なるitemを別versionでは表示しない', () => {
		const canonical: UserInventoryState = {
			playerId: 'player',
			itemCategoryList: [
				{
					itemCategory: 1,
					userItemList: [
						{
							...createItem(10, 3),
							identityFingerprint: {
								domain: 'item',
								value: 'original',
							},
						},
					],
				},
			],
		};
		const changed = projectUserInventory(canonical, {
			hasItem: () => true,
			getItemFingerprint: () => ({ domain: 'item', value: 'changed' }),
		});
		const original = projectUserInventory(canonical, {
			hasItem: () => true,
			getItemFingerprint: () => ({ domain: 'item', value: 'original' }),
		});

		expect(changed.itemCategoryList[0]?.userItemList).toEqual([]);
		expect(original.itemCategoryList[0]?.userItemList).toHaveLength(1);
		expect(canonical.itemCategoryList[0]?.userItemList).toHaveLength(1);
	});
});

function createItem(itemId: number, itemNum: number) {
	return {
		userItemId: `item-${itemId}`,
		itemId,
		itemNum,
		itemType: 1,
		limitDateTime: null,
		rarity: 1,
		resourceFileName: '',
	};
}

function readCardDatasId(card: { card_datas_id?: unknown }): unknown {
	return card.card_datas_id;
}
