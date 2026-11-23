import { isRecord } from '../state/json-state-utils.ts';

export function migrateRawShopExchangeStates(
	state: Record<string, unknown>,
): void {
	if (!Array.isArray(state.userShopExchanges)) return;
	for (const exchange of state.userShopExchanges) {
		if (!isRecord(exchange)) continue;
		delete exchange.isConvertibleLimitBreakMaterial;
		delete exchange.gpPrizeUserTicketList;
		if (Array.isArray(exchange.shopList))
			for (const shop of exchange.shopList) {
				if (!isRecord(shop)) continue;
				delete shop.name;
				delete shop.orderId;
				delete shop.isExistProducts;
			}
		if (Array.isArray(exchange.itemExchangeList))
			for (const item of exchange.itemExchangeList) {
				if (!isRecord(item)) continue;
				delete item.userMaterialItemNum;
				delete item.userProductItemNum;
			}
	}
}

export function migrateRawSiscaStoreStates(
	state: Record<string, unknown>,
): void {
	if (!Array.isArray(state.userSiscaStores)) return;
	for (const store of state.userSiscaStores) {
		if (!isRecord(store) || !Array.isArray(store.itemList)) continue;
		for (const item of store.itemList) {
			if (!isRecord(item)) continue;
			delete item.itemType;
			delete item.itemId;
			delete item.itemNum;
			delete item.ownNum;
		}
	}
}
