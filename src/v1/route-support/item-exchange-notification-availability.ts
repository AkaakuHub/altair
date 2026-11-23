import type { Database } from 'bun:sqlite';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { getShopExchangeMasterFromDatabase } from '../active-master-database/shop-exchange-responses.ts';
import { canReceiveItemFromDatabase } from './item-receive-availability.ts';
import { projectUserOwnedState } from './project-user-owned-state.ts';
import {
	findUserShopExchange,
	hasUserItem,
} from './shop-notification-user-state.ts';

export function hasAvailableItemExchangeFromDatabase(
	database: Database,
	state: ServerState,
	user: RegisteredUserState | undefined,
): boolean {
	return hasAvailableItemExchangeByCategory(database, state, user);
}

function hasAvailableItemExchangeByCategory(
	database: Database,
	state: ServerState,
	user: RegisteredUserState | undefined,
): boolean {
	if (!user) return false;
	const { inventory } = projectUserOwnedState(database, state, user.playerId);
	if (!inventory) return false;
	const master = getShopExchangeMasterFromDatabase(database);
	const exchange = findUserShopExchange(state, user.playerId);
	return master.itemExchangeList.some((item) => {
		const entry = exchange?.itemExchangeList.find(
			(candidate) => candidate.itemExchangesId === item.itemExchangesId,
		);
		return (
			entry?.isLock !== true &&
			item.materialItemId !== undefined &&
			item.materialItemNum !== undefined &&
			item.productItemId !== undefined &&
			item.productItemNum !== undefined &&
			hasUserItem(inventory, item.materialItemId, item.materialItemNum) &&
			canReceiveItemFromDatabase(
				database,
				inventory,
				item.productItemId,
				item.productItemNum,
			)
		);
	});
}
