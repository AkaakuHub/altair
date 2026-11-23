import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import type { ShopExchangeMaster } from './shop-exchange-definition.ts';
import type { UserShopExchangeState } from './shop-exchange-types.ts';

export function ensureUserShopExchangeState(
	state: Pick<ServerState, 'userShopExchanges'>,
	playerId: string,
	master: ShopExchangeMaster,
): EnsureStateResult<UserShopExchangeState> {
	const existing = state.userShopExchanges.find(
		(exchange) => exchange.playerId === playerId,
	);
	if (existing) return { value: existing, created: false };
	const exchange: UserShopExchangeState = {
		playerId,
		shopList: master.shopList.map((shop) => ({
			shopType: shop.shopType,
			isMaintenance: false,
		})),
		petalExchangePurchaseList: [],
		gpPrizeExchangeList: master.gpPrizeExchangeList.map((item) => ({
			gpPrizeExchangesId: item.gpPrizeExchangesId,
			isHaving: false,
			remainingExchangeNum: 0,
		})),
		itemExchangeList: master.itemExchangeList.map((item) => ({
			itemExchangesId: item.itemExchangesId,
			isLock: false,
			remainingExchangeNum: 0,
		})),
	};
	state.userShopExchanges = [...state.userShopExchanges, exchange];
	return { value: exchange, created: true };
}
