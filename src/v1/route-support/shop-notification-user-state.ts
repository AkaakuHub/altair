import type { ServerState } from '../../server-state-schema.ts';
import type { UserShopExchangeState } from '../../state/shop-exchange-types.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';

export function hasUserItem(
	inventory: UserInventoryState,
	itemId: number,
	itemNum: number,
): boolean {
	return (findUserItemByItemId(inventory, itemId)?.itemNum ?? 0) >= itemNum;
}

export function findUserShopExchange(
	state: Pick<ServerState, 'userShopExchanges'>,
	playerId: string,
): UserShopExchangeState | undefined {
	return state.userShopExchanges.find(
		(exchange) => exchange.playerId === playerId,
	);
}
