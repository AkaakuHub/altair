import type { Database } from 'bun:sqlite';
import { getItemDefinitionByItemIdFromDatabase } from '../../../../../../src/master-data/item-master.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import { findUserInventory } from '../../../../../../src/state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../../../../../src/state/user-item-definition.ts';
import { setUserItemQuantity } from '../../../../../../src/state/user-item-mutation.ts';
import {
	type OfficialDataMigrationDump,
	readNumber,
} from '../official-data-migration-dump.ts';

const petalCoinItemId = 3007001;
const stickerPointItemId = 3009001;

export function applyOfficialDataMigrationItemQuantities(
	state: ServerState,
	playerId: string,
	dump: OfficialDataMigrationDump,
	database: Database,
): boolean {
	const inventory = findUserInventory(state, playerId);
	if (inventory === undefined) {
		return false;
	}
	let changed = false;
	const petalCoinNum = readNumber(
		dump.responsesByPath.get('/v1/petal_exchange/get_list')?.petal_coin_num,
	);
	if (petalCoinNum !== null) {
		changed =
			setItemQuantity(database, inventory, petalCoinItemId, petalCoinNum) ||
			changed;
	}
	const stickerPointNum = readNumber(
		dump.responsesByPath.get('/v1/sticker_exchange/get_list')
			?.sticker_point_num,
	);
	if (stickerPointNum !== null) {
		changed =
			setItemQuantity(
				database,
				inventory,
				stickerPointItemId,
				stickerPointNum,
			) || changed;
	}
	return changed;
}

function setItemQuantity(
	database: Database,
	inventory: UserInventoryState,
	itemId: number,
	itemNum: number,
): boolean {
	const definition = getItemDefinitionByItemIdFromDatabase(database, itemId);
	if (definition === undefined) {
		return false;
	}
	setUserItemQuantity(inventory, definition, itemNum);
	return true;
}
