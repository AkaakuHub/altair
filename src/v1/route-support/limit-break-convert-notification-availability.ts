import type { Database } from 'bun:sqlite';
import {
	getLimitBreakMaterialConvertMasterFromDatabase,
	getLimitBreakMaterialConvertRatesFromDatabase,
} from '../../master-data/shop-exchange-purchase-master.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import { canReceiveItemFromDatabase } from './item-receive-availability.ts';
import { projectUserOwnedState } from './project-user-owned-state.ts';

const ITEM_TYPE_ITEM = 1;

export function hasAvailableLimitBreakMaterialConvertFromDatabase(
	database: Database,
	state: ServerState,
	user: RegisteredUserState | undefined,
): boolean {
	if (!user) return false;
	const { inventory } = projectUserOwnedState(database, state, user.playerId);
	if (!inventory) return false;
	const materialItemIdsByRarity = new Map<number, number[]>();
	for (const material of getLimitBreakMaterialConvertMasterFromDatabase(
		database,
	)) {
		const itemIds = materialItemIdsByRarity.get(material.rarity) ?? [];
		itemIds.push(material.itemId);
		materialItemIdsByRarity.set(material.rarity, itemIds);
	}
	for (const rate of getLimitBreakMaterialConvertRatesFromDatabase(database)) {
		if (rate.materialNum <= 0 || rate.productItemType !== ITEM_TYPE_ITEM)
			continue;
		const materialCount = (
			materialItemIdsByRarity.get(rate.rarity) ?? []
		).reduce(
			(total, itemId) =>
				total + (findUserItemByItemId(inventory, itemId)?.itemNum ?? 0),
			0,
		);
		const convertCount = Math.floor(materialCount / rate.materialNum);
		if (
			convertCount > 0 &&
			canReceiveItemFromDatabase(
				database,
				inventory,
				rate.productItemId,
				convertCount * rate.productItemNum,
			)
		)
			return true;
	}
	return false;
}
