import type { Database } from 'bun:sqlite';
import {
	getGiftBoxBordersFromMaster,
	getGiftPointFromMaster,
	getGiftShopItemsForCharacters,
} from '../../master-data/gift-shop-catalog.ts';
import { getGiftShopLiveCharacterIds } from '../../master-data/gift-shop-character-source.ts';
import type { GiftShopLiveKind } from '../../master-data/gift-shop-definition.ts';
import { getMessageCardShopItemsFromMaster } from '../../master-data/message-card-master.ts';
import {
	findUserItemByItemId,
	findUserItemByUserItemId,
} from '../../state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import { consumeUserItem } from '../../state/user-item-mutation.ts';
import { createMasterReleaseItemProvenance } from './item-consumption.ts';

export function consumeGiftShopItem(
	database: Database,
	masterReleaseId: string,
	liveId: string,
	liveKind: GiftShopLiveKind,
	inventory: UserInventoryState,
	userItemId: string,
	amount: number,
): number | undefined {
	if (!Number.isSafeInteger(amount) || amount <= 0) {
		return undefined;
	}
	const userItem = findUserItemByUserItemId(inventory, userItemId);
	if (!userItem) {
		return undefined;
	}
	const giftPoint = getGiftPointFromMaster(
		database,
		liveId,
		liveKind,
		userItem.itemId,
	);
	const provenance = createMasterReleaseItemProvenance(
		database,
		masterReleaseId,
		userItem.itemId,
	);
	if (
		giftPoint === undefined ||
		provenance === undefined ||
		!consumeUserItem(inventory, userItemId, userItem.itemId, amount, provenance)
	) {
		return undefined;
	}
	return giftPoint * amount;
}

export function createGiftShopListResponse(
	database: Database,
	liveId: string,
	liveKind: GiftShopLiveKind,
	inventory: UserInventoryState,
) {
	return createGiftShopListForCharactersResponse(
		database,
		getGiftShopLiveCharacterIds(database, liveId, liveKind),
		inventory,
	);
}

export function createGiftShopListForCharactersResponse(
	database: Database,
	characterIds: ReadonlySet<number>,
	inventory: UserInventoryState,
) {
	const giftItemIds = new Set(
		inventory.itemCategoryList.flatMap((category) =>
			category.userItemList
				.filter((item) => item.itemType === 1)
				.map((item) => item.itemId),
		),
	);
	return {
		gift_shop_item_info: getGiftShopItemsForCharacters(
			database,
			characterIds,
			giftItemIds,
		).map((item) => {
			const userItem = findUserItemByItemId(inventory, item.itemId);
			const ownNum = userItem?.itemNum ?? 0;
			const itemDatasId = ownNum > 0 && userItem ? userItem.userItemId : null;
			const itemGetDateTime = userItem?.pickupTime ?? null;
			return {
				shop_item_id: 0,
				item_id: item.itemId,
				name: item.name,
				order_id: 0,
				description: item.description,
				item_type: item.itemType,
				item_quantity: 0,
				is_paid_sisca_only: false,
				price: 0,
				rarity: item.rarity,
				character_id: 0,
				effect_value: item.effectValue,
				own_num: ownNum,
				start_time: '0001-01-01T00:00:00Z',
				end_time: '0001-01-01T00:00:00Z',
				is_sale: false,
				gift_pt: item.giftPoint,
				max_favorite_rank: item.maxFavoriteRank,
				gift_bonus_info: item.giftBonusInfo.map((bonus) => ({
					character_id: bonus.characterId,
					favorite_rank: bonus.favoriteRank,
					order: bonus.order,
				})),
				item_datas_id: itemDatasId,
				item_get_date_time: itemGetDateTime,
			};
		}),
		message_card_shop_info: getMessageCardShopItemsFromMaster(database).map(
			(item) => {
				const userItem = findUserItemByItemId(inventory, item.itemId);
				const ownNum = userItem?.itemNum ?? 0;
				const itemDatasId = ownNum > 0 && userItem ? userItem.userItemId : null;
				const itemGetDateTime = userItem?.pickupTime ?? null;
				return {
					shop_item_id: item.shopItemId,
					item_id: item.itemId,
					name: item.name,
					order_id: item.orderId,
					description: item.description,
					item_type: item.itemType,
					item_quantity: item.itemQuantity,
					is_paid_sisca_only: item.isPaidSiscaOnly,
					price: item.price,
					rarity: item.rarity,
					character_id: 0,
					effect_value: item.effectValue,
					own_num: ownNum,
					start_time: item.startTime,
					end_time: item.endTime,
					is_sale: true,
					gift_pt: 0,
					limit_characters_num: item.limitCharactersNum,
					item_datas_id: itemDatasId,
					item_get_date_time: itemGetDateTime,
				};
			},
		),
		gift_box_borders: getGiftBoxBordersFromMaster(),
	};
}
