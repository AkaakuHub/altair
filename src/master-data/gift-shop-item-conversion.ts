import type { Database } from 'bun:sqlite';
import type {
	GiftBonusMaster,
	GiftItemRow,
	GiftShopItemMaster,
} from './gift-shop-definition.ts';

export function createGiftShopItemMaster(
	database: Database,
	row: GiftItemRow,
	liveCharacterIds: ReadonlySet<number>,
): GiftShopItemMaster {
	const giftBonusInfo = getGiftBonusInfo(database, row.id, liveCharacterIds);
	const maxFavoriteRank = Math.max(
		0,
		...giftBonusInfo.map((bonus) => bonus.favoriteRank),
	);
	return {
		itemId: row.id,
		name: row.name,
		description: row.description,
		itemType: row.item_type,
		rarity: row.rarity,
		effectValue: row.effect_value,
		giftPoint: calculateGiftPoint(row.effect_value, maxFavoriteRank),
		maxFavoriteRank,
		giftBonusInfo,
	};
}
export function calculateGiftPoint(
	effectValue: number,
	maxFavoriteRank: number,
): number {
	if (maxFavoriteRank >= 2) return effectValue * 2;
	if (maxFavoriteRank === 1) return Math.trunc(effectValue * 1.3);
	return effectValue;
}
export function compareGiftShopItemMaster(
	left: GiftShopItemMaster,
	right: GiftShopItemMaster,
): number {
	return (
		right.giftPoint - left.giftPoint ||
		right.maxFavoriteRank - left.maxFavoriteRank ||
		right.rarity - left.rarity ||
		left.itemId - right.itemId
	);
}
function getGiftBonusInfo(
	database: Database,
	itemId: number,
	liveCharacterIds: ReadonlySet<number>,
): GiftBonusMaster[] {
	return database
		.query<
			{ characters_id: number; favorite_rank: number; icon_order_id: number },
			[number]
		>(
			'SELECT f.characters_id, f.favorite_rank, c.icon_order_id FROM master_character_favorite_gifts f JOIN master_characters c ON c.id = f.characters_id WHERE f.items_id = ? ORDER BY c.icon_order_id, f.characters_id',
		)
		.all(itemId)
		.filter((row) => liveCharacterIds.has(row.characters_id))
		.map((row) => ({
			characterId: row.characters_id,
			favoriteRank: row.favorite_rank,
			order: row.icon_order_id,
		}));
}
