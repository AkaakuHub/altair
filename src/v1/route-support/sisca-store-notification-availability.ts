import type { Database } from 'bun:sqlite';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { getSiscaStoreMasterFromDatabase } from '../active-master-database/sisca-store-responses.ts';
import { canReceiveItemFromDatabase } from './item-receive-availability.ts';
import { projectUserOwnedState } from './project-user-owned-state.ts';
import { canPaySiscaBalance } from './shop-notification-domain.ts';

export function hasAvailableSiscaStorePurchaseFromDatabase(
	database: Database,
	state: ServerState,
	user: RegisteredUserState | undefined,
): boolean {
	if (!user) return false;
	const { inventory } = projectUserOwnedState(database, state, user.playerId);
	if (!inventory) return false;
	const status = state.userStatuses.find(
		(candidate) => candidate.playerId === user.playerId,
	);
	if (!status) return false;
	const paid =
		user.platformType === 2 ? status.jewelPaidApple : status.jewelPaidGoogle;
	const store = state.userSiscaStores.find(
		(candidate) => candidate.playerId === user.playerId,
	);
	for (const masterItem of getSiscaStoreMasterFromDatabase(database).itemList) {
		const storeItem = store?.itemList.find(
			(item) => item.siscaStoreDatasId === masterItem.siscaStoreDatasId,
		);
		const buyableNum =
			storeItem?.buyableNum ??
			(masterItem.limitNum > 0 ? masterItem.limitNum : -1);
		if (
			buyableNum !== 0 &&
			canPaySiscaBalance(
				status.jewelFree,
				paid,
				masterItem.price,
				masterItem.isPaidSiscaOnly,
			) &&
			canReceiveItemFromDatabase(
				database,
				inventory,
				masterItem.itemId,
				masterItem.itemNum,
			)
		)
			return true;
	}
	return false;
}
