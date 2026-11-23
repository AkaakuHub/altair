import type { Database } from 'bun:sqlite';
import { getItemIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import {
	consumeSisca,
	createSiscaBalanceForUser,
	type SiscaBalance,
} from '../../state/sisca-state.ts';
import type { SiscaStoreMaster } from '../../state/sisca-store-master.ts';
import type { UserSiscaStoreState } from '../../state/sisca-store-state.ts';
import { purchaseSiscaStoreItem } from '../../state/sisca-store-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import type { UserItemState } from '../../state/user-item-definition.ts';
import {
	addUserItemQuantity,
	canApplyUserItemProvenance,
} from '../../state/user-item-mutation.ts';
import type { UserStatusAccess } from '../../state/user-status-port.ts';
import { canReceiveItemFromDatabase } from './item-receive-availability.ts';

type SiscaStorePurchaseResult =
	| {
			type: 'success';
			siscaBalance: SiscaBalance;
			userItem: UserItemState;
	  }
	| { type: 'invalid' }
	| { type: 'notAvailable' }
	| { type: 'siscaInsufficient' }
	| { type: 'itemDefinitionNotFound' };

export function purchaseSiscaStoreItemForUser(params: {
	database: Database;
	sourceMasterReleaseId: string;
	state: ServerState;
	user: RegisteredUserState;
	store: UserSiscaStoreState;
	master: SiscaStoreMaster;
	userItemsGetList: unknown;
	siscaStoreDatasId: number;
	purchaseNum: number;
	userStatus: UserStatusAccess;
}): SiscaStorePurchaseResult {
	const {
		database,
		sourceMasterReleaseId,
		state,
		user,
		store,
		master,
		userItemsGetList,
		siscaStoreDatasId,
		purchaseNum,
		userStatus,
	} = params;
	if (purchaseNum <= 0) {
		return { type: 'invalid' };
	}
	const masterItem = master.itemList.find(
		(item) => item.siscaStoreDatasId === siscaStoreDatasId,
	);
	if (!masterItem) {
		return { type: 'notAvailable' };
	}
	const storeItem = store.itemList.find(
		(item) => item.siscaStoreDatasId === siscaStoreDatasId,
	);
	const buyableNum =
		storeItem?.buyableNum ??
		(masterItem.limitNum > 0 ? masterItem.limitNum : -1);
	if (buyableNum === 0 || (buyableNum > 0 && buyableNum < purchaseNum)) {
		return { type: 'notAvailable' };
	}
	const itemDefinition = getItemDefinitionByItemIdFromDatabase(
		database,
		masterItem.itemId,
	);
	if (!itemDefinition) {
		return { type: 'itemDefinitionNotFound' };
	}
	const { value: inventory } = ensureUserInventory(
		state,
		user.playerId,
		userItemsGetList,
	);
	const identityFingerprint = getItemIdentityFingerprint(
		database,
		masterItem.itemId,
	);
	if (
		identityFingerprint === undefined ||
		!canApplyUserItemProvenance(inventory, masterItem.itemId, {
			sourceMasterReleaseId,
			identityFingerprint,
		})
	) {
		return { type: 'notAvailable' };
	}
	if (
		!canReceiveItemFromDatabase(
			database,
			inventory,
			masterItem.itemId,
			masterItem.itemNum * purchaseNum,
		)
	) {
		return { type: 'notAvailable' };
	}
	const siscaBalance = consumeSisca(
		state,
		user,
		masterItem.price * purchaseNum,
		masterItem.isPaidSiscaOnly,
		userStatus,
	);
	if (!siscaBalance) {
		return { type: 'siscaInsufficient' };
	}
	const purchasedItem = purchaseSiscaStoreItem(store, masterItem, purchaseNum);
	if (!purchasedItem) {
		return { type: 'notAvailable' };
	}
	const userItem = addUserItemQuantity(
		state,
		user.playerId,
		itemDefinition,
		masterItem.itemNum * purchaseNum,
		{ sourceMasterReleaseId, identityFingerprint },
	);
	if (!userItem) {
		return { type: 'itemDefinitionNotFound' };
	}
	return {
		type: 'success',
		siscaBalance: createSiscaBalanceForUser(state, user, userStatus),
		userItem,
	};
}
