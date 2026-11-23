import type { UserShopExchangeState } from '../state/shop-exchange-types.ts';

export function migrateUserShopExchangeState(
	exchange: UserShopExchangeState,
): void {
	exchange.petalExchangePurchaseList ??= [];
	delete (exchange as { stickerExchangeList?: unknown }).stickerExchangeList;
	delete (exchange as { petalCoinNum?: unknown }).petalCoinNum;
	delete (exchange as { stickerPointNum?: unknown }).stickerPointNum;
}
