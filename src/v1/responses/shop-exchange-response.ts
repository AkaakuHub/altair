import type { Database } from 'bun:sqlite';
import type { EntityProvenance } from '../../state/entity-provenance.ts';
import type {
	GpPrizeExchangeMaster,
	ItemExchangeMaster,
	ShopExchangeMaster,
	StickerExchangeMaster,
} from '../../state/shop-exchange-definition.ts';
import type { UserShopExchangeState } from '../../state/shop-exchange-types.ts';
import { findGpPrizeExchangeState } from '../../state/shop-gp-prize-progress.ts';
import { findItemExchangeState } from '../../state/shop-item-exchange-progress.ts';
import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import type {
	GpPrizeExchangeListResponse,
	GpPrizeExchangePurchaseResponse,
	ItemExchangeListResponse,
	LimitBreakMaterialConvertListResponse,
	PetalExchangeListResponse,
	ShopListResponse,
	StickerExchangeListResponse,
} from '../response-types/shop-inventory-response-types.ts';
import {
	aggregateLimitBreakMaterialNumByRarity,
	createCharacterPetalExchangeList,
	getInventoryItemNum,
	isHavingGpPrizeExchange,
} from './shop-exchange-inventory-read-model.ts';
import {
	getGpPrizeProductCardTemplate,
	getLimitBreakMaterialConvertMasters,
	getPetalExchangeCardMasters,
} from './shop-exchange-master-query.ts';

export function createShopListResponse(
	exchange: UserShopExchangeState,
	master: ShopExchangeMaster,
): ShopListResponse {
	return {
		is_convertible_limit_break_material: master.isConvertibleLimitBreakMaterial,
		shop_list: master.shopList.map((shop) => ({
			is_exist_products: shop.isExistProducts,
			is_maintenance:
				exchange.shopList.find((state) => state.shopType === shop.shopType)
					?.isMaintenance ?? false,
			name: shop.name,
			order_id: shop.orderId,
			shop_type: shop.shopType,
		})),
	};
}

export function createPetalExchangeListResponse(
	database: Database,
	exchange: UserShopExchangeState,
	userCards: UserCardCollectionState | undefined,
	inventory: UserInventoryState | undefined,
	petalCoinItemNum: number,
): PetalExchangeListResponse {
	return {
		character_petal_exchange_list: createCharacterPetalExchangeList(
			exchange,
			userCards,
			inventory,
			userCards === undefined
				? new Map()
				: getPetalExchangeCardMasters(database, userCards),
		),
		petal_coin_num: petalCoinItemNum,
	};
}

export function createGpPrizeExchangeListResponse(
	database: Database,
	exchange: UserShopExchangeState,
	inventory: UserInventoryState | undefined,
	gpPrizeExchangeMaster: readonly GpPrizeExchangeMaster[],
	userCards: UserCardCollectionState | undefined,
	resolveProvenance: (
		gpPrizeExchangesId: number,
	) => EntityProvenance | undefined,
): GpPrizeExchangeListResponse {
	return {
		gp_prize_exchange_list: gpPrizeExchangeMaster.map((master) => {
			const provenance = resolveProvenance(master.gpPrizeExchangesId);
			const entry =
				provenance === undefined
					? undefined
					: findGpPrizeExchangeState(
							exchange,
							master.gpPrizeExchangesId,
							provenance,
						);
			return {
				gp_prize_exchanges_id: master.gpPrizeExchangesId,
				is_having: isHavingGpPrizeExchange(
					entry?.isHaving ?? false,
					master,
					getGpPrizeProductCardTemplate(database, master),
					userCards,
				),
				remaining_exchange_num: entry?.remainingExchangeNum ?? 0,
			};
		}),
		user_ticket_list: [
			...new Set(
				gpPrizeExchangeMaster
					.map((master) => master.materialItemId)
					.filter((itemId): itemId is number => itemId !== undefined),
			),
		]
			.sort((left, right) => left - right)
			.map((itemId) => ({
				item_id: itemId,
				user_num: getInventoryItemNum(inventory, itemId),
			})),
	};
}

export function createGpPrizeExchangePurchaseResponse(
	inventory: UserInventoryState,
	materialItemId: number,
): GpPrizeExchangePurchaseResponse {
	return {
		gp_prize_ticket_id: materialItemId - 3011000,
		user_ticket_num: getInventoryItemNum(inventory, materialItemId),
	};
}

export function createItemExchangeListResponse(
	exchange: UserShopExchangeState,
	inventory: UserInventoryState | undefined,
	itemExchangeMaster: readonly ItemExchangeMaster[],
	isConvertibleLimitBreakMaterial: boolean,
	categoryListId: number | undefined,
	resolveProvenance: (itemExchangesId: number) => EntityProvenance | undefined,
): ItemExchangeListResponse {
	const itemExchangeList =
		categoryListId === undefined
			? itemExchangeMaster
			: itemExchangeMaster.filter(
					(entry) => entry.categoryListId === categoryListId,
				);
	return {
		is_convertible_limit_break_material: isConvertibleLimitBreakMaterial,
		item_exchange_list: itemExchangeList.map((master) => {
			const provenance = resolveProvenance(master.itemExchangesId);
			const entry =
				provenance === undefined
					? undefined
					: findItemExchangeState(exchange, master.itemExchangesId, provenance);
			return {
				is_lock: entry?.isLock ?? false,
				item_exchanges_id: master.itemExchangesId,
				remaining_exchange_num: entry?.remainingExchangeNum ?? 0,
				user_material_item_num: getInventoryItemNum(
					inventory,
					master.materialItemId,
				),
				user_product_item_num: getInventoryItemNum(
					inventory,
					master.productItemId,
				),
			};
		}),
	};
}

export function createStickerExchangeListResponse(
	stickerExchangeList: readonly StickerExchangeMaster[],
	ownedStickerIds: readonly number[],
	stickerPointItemNum: number,
): StickerExchangeListResponse {
	const ownedStickerIdSet = new Set(ownedStickerIds);
	return {
		sticker_exchange_list: stickerExchangeList.map((entry) => ({
			is_having:
				entry.productStickerId !== undefined &&
				ownedStickerIdSet.has(entry.productStickerId),
			sticker_exchanges_id: entry.stickerExchangesId,
		})),
		sticker_point_num: stickerPointItemNum,
	};
}

export function createLimitBreakMaterialConvertListResponse(
	database: Database,
	inventory: UserInventoryState | undefined,
): LimitBreakMaterialConvertListResponse {
	const materialNumByRarity = aggregateLimitBreakMaterialNumByRarity(
		getLimitBreakMaterialConvertMasters(database),
		inventory,
	);
	return {
		convert_limit_break_material_list: [...materialNumByRarity.entries()].map(
			([rarity, limitBreakMaterialNum]) => ({
				limit_break_material_num: limitBreakMaterialNum,
				rarity,
			}),
		),
	};
}
