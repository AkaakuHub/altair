import type { PetalExchangeCardMaster } from '../../master-data/petal-exchange-master.ts';
import { getPetalExchangeIdentityFingerprint } from '../../master-data/petal-exchange-master.ts';
import type { LimitBreakMaterialConvertMaster } from '../../master-data/shop-exchange-purchase-master.ts';
import { readNumber } from '../../state/json-state-utils.ts';
import type { GpPrizeExchangeMaster } from '../../state/shop-exchange-definition.ts';
import type { UserShopExchangeState } from '../../state/shop-exchange-types.ts';
import { getPetalExchangePurchaseTotal } from '../../state/shop-petal-purchase-progress.ts';
import {
	hasUserCardTemplateSeries,
	type UserCardCollectionState,
} from '../../state/user-card-aggregate-state.ts';
import type { UserCardTemplateState } from '../../state/user-card-types.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import type {
	CharacterPetalExchangeResponse,
	PetalExchangeEntryResponse,
} from '../response-types/shop-inventory-response-types.ts';

export function getInventoryItemNum(
	inventory: UserInventoryState | undefined,
	itemId: number | undefined,
): number {
	return inventory === undefined || itemId === undefined
		? 0
		: (findUserItemByItemId(inventory, itemId)?.itemNum ?? 0);
}

export function createCharacterPetalExchangeList(
	exchange: UserShopExchangeState,
	userCards: UserCardCollectionState | undefined,
	inventory: UserInventoryState | undefined,
	cardMasterById: ReadonlyMap<number, PetalExchangeCardMaster>,
): CharacterPetalExchangeResponse[] {
	if (!userCards) {
		return [];
	}
	const exchangeListByCharacterId = new Map<
		number,
		PetalExchangeEntryResponse[]
	>();
	for (const card of userCards.userCardDataList) {
		const cardDatasId = readNumber(
			card.card_datas_id,
			'user card card_datas_id',
		);
		const cardMaster = cardMasterById.get(cardDatasId);
		if (!cardMaster) {
			continue;
		}
		const entry = {
			card_datas_id: cardMaster.cardDatasId,
			card_series_id: cardMaster.cardSeriesId,
			item_num: getInventoryItemNum(inventory, cardMaster.materialItemId),
			limit_break_times: readNumber(
				card.limit_break_times,
				'user card limit_break_times',
			),
			total_num: getPetalExchangePurchaseTotal(
				exchange,
				cardMaster.cardSeriesId,
				getPetalExchangeIdentityFingerprint(cardMaster),
			),
		};
		const exchangeList = exchangeListByCharacterId.get(cardMaster.characterId);
		if (exchangeList) {
			exchangeList.push(entry);
		} else {
			exchangeListByCharacterId.set(cardMaster.characterId, [entry]);
		}
	}
	return [...exchangeListByCharacterId.entries()].map(
		([characterId, limitBreakExchangeList]) => ({
			character_id: characterId,
			limit_break_exchange_list: limitBreakExchangeList,
		}),
	);
}

export function isHavingGpPrizeExchange(
	stateIsHaving: boolean,
	master: GpPrizeExchangeMaster,
	productCardTemplate: UserCardTemplateState | undefined,
	userCards: UserCardCollectionState | undefined,
): boolean {
	if (
		master.productItemType !== 2 ||
		typeof master.productItemId !== 'number'
	) {
		return stateIsHaving;
	}
	return userCards !== undefined && productCardTemplate !== undefined
		? hasUserCardTemplateSeries(userCards, productCardTemplate)
		: false;
}

export function aggregateLimitBreakMaterialNumByRarity(
	masters: readonly LimitBreakMaterialConvertMaster[],
	inventory: UserInventoryState | undefined,
): ReadonlyMap<number, number> {
	const materialNumByRarity = new Map<number, number>();
	for (const master of masters) {
		const itemNum = getInventoryItemNum(inventory, master.itemId);
		if (itemNum > 0) {
			materialNumByRarity.set(
				master.rarity,
				(materialNumByRarity.get(master.rarity) ?? 0) + itemNum,
			);
		}
	}
	return materialNumByRarity;
}
