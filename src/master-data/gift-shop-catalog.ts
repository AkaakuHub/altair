import type { Database } from 'bun:sqlite';
import { getGiftShopLiveCharacterIds } from './gift-shop-character-source.ts';
import type {
	GiftItemRow,
	GiftShopItemMaster,
	GiftShopLiveKind,
} from './gift-shop-definition.ts';
import {
	compareGiftShopItemMaster,
	createGiftShopItemMaster,
} from './gift-shop-item-conversion.ts';

const defaultGiftBoxBorders = [0, 1000, 10000] as const;
export function getGiftBoxBordersFromMaster(): number[] {
	return [...defaultGiftBoxBorders];
}
export function getGiftShopItemsForCharacters(
	database: Database,
	characters: ReadonlySet<number>,
	itemIds: ReadonlySet<number>,
): GiftShopItemMaster[] {
	return database
		.query<GiftItemRow, []>(
			'SELECT id, name, description, item_type, rarity, effect_value FROM master_items WHERE item_type = 1 AND item_category = 2 ORDER BY id',
		)
		.all()
		.filter((row) => itemIds.has(row.id))
		.map((row) => createGiftShopItemMaster(database, row, characters))
		.sort(compareGiftShopItemMaster);
}
export function getGiftPointFromMaster(
	database: Database,
	liveId: string,
	liveKind: GiftShopLiveKind,
	itemId: number,
): number | undefined {
	return getGiftPointForCharacters(
		database,
		getGiftShopLiveCharacterIds(database, liveId, liveKind),
		itemId,
	);
}

export function getGiftPointForCharacters(
	database: Database,
	characterIds: ReadonlySet<number>,
	itemId: number,
): number | undefined {
	const row = database
		.query<GiftItemRow, [number]>(
			'SELECT id, name, description, item_type, rarity, effect_value FROM master_items WHERE id = ? AND item_type = 1 AND item_category = 2',
		)
		.get(itemId);
	return row
		? createGiftShopItemMaster(database, row, characterIds).giftPoint
		: undefined;
}
