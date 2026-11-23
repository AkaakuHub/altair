import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import {
	officialUserInitialStateCatalog,
	readOfficialUserInitialStateObject,
} from '../../src/official-user-initial-state.ts';
import type { UserCardCollectionState } from '../../src/state/user-card-aggregate-state.ts';
import { ensureUserCards } from '../../src/state/user-card-aggregate-state.ts';
import { ensureUserInventory } from '../../src/state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../src/state/user-item-definition.ts';

const root = fileURLToPath(
	new URL('../../official-user-initial-state', import.meta.url),
);
const cardsSeed = readOfficialUserInitialStateObject(
	root,
	officialUserInitialStateCatalog.cards,
);
const itemsSeed = readOfficialUserInitialStateObject(
	root,
	officialUserInitialStateCatalog.items,
);

test('initial templates never replace persisted ownership', () => {
	const cards: UserCardCollectionState = {
		playerId: 'existing',
		userCardDataList: [{ card_datas_id: 1, d_card_datas_id: 'existing-card' }],
	};
	const inventory: UserInventoryState = {
		playerId: 'existing',
		itemCategoryList: [],
	};
	const state = { userCards: [cards], userInventories: [inventory] };
	const expected = structuredClone(state);
	expect(ensureUserCards(state, 'existing', cardsSeed)).toEqual({
		value: cards,
		created: false,
	});
	expect(ensureUserInventory(state, 'existing', itemsSeed)).toEqual({
		value: inventory,
		created: false,
	});
	expect(state).toEqual(expected);
});

test('new users receive independent cards and inventory from the same template', () => {
	const state: {
		userCards: UserCardCollectionState[];
		userInventories: UserInventoryState[];
	} = { userCards: [], userInventories: [] };
	const firstCards = ensureUserCards(state, 'first', cardsSeed).value;
	const secondCards = ensureUserCards(state, 'second', cardsSeed).value;
	const firstInventory = ensureUserInventory(state, 'first', itemsSeed).value;
	const secondInventory = ensureUserInventory(state, 'second', itemsSeed).value;
	const secondCardsBefore = structuredClone(secondCards);
	const secondInventoryBefore = structuredClone(secondInventory);
	const card = firstCards.userCardDataList[0];
	const item = firstInventory.itemCategoryList.flatMap(
		(category) => category.userItemList,
	)[0];
	if (card === undefined || item === undefined)
		throw new Error('Initial templates must contain cards and inventory');
	card.style_level = 10;
	item.itemNum += 1;
	expect(secondCards).toEqual(secondCardsBefore);
	expect(secondInventory).toEqual(secondInventoryBefore);
	expect(firstCards.userCardDataList).toHaveLength(13);
	expect(
		firstInventory.itemCategoryList.flatMap(
			(category) => category.userItemList,
		),
	).toHaveLength(4);
});
