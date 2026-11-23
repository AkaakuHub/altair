import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import type { EntityProvenance } from '../../../../../src/state/entity-provenance.ts';
import type { ItemCatalogEntry } from '../../../../../src/state/item-definition.ts';
import {
	isFreeSiscaItemId,
	isPaidSiscaItemId,
	isSiscaItemId,
} from '../../../../../src/state/sisca-state.ts';
import { ensureEmptyUserInventory } from '../../../../../src/state/user-inventory-aggregate.ts';
import {
	addUserItemQuantity,
	assertUserItemIdentity,
	setUserItemQuantity,
	updateUserItemNum,
} from '../../../../../src/state/user-item-mutation.ts';
import { findAdminEntryByKey } from '../../state/domain/admin-state-writer.ts';
import {
	type AdminForm,
	getAdminItemQuantity,
	getFormInteger,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateUserItemState(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const userItemId = getFormString(form, 'userItemId');
	const itemNum = getAdminItemQuantity(form, 'itemNum', 0);
	const inventory = findAdminEntryByKey(
		state.userInventories,
		playerId,
		(userInventory) => userInventory.playerId,
	);
	const item = inventory?.itemCategoryList
		.flatMap((category) => category.userItemList)
		.find((userItem) => userItem.userItemId === userItemId);
	if (
		playerId.length === 0 ||
		userItemId.length === 0 ||
		itemNum === undefined ||
		item === undefined ||
		isSiscaItemId(item.itemId)
	) {
		return false;
	}
	return updateUserItemNum(state, playerId, userItemId, itemNum);
}

export function addUserItemFromForm(
	form: AdminForm,
	state: ServerState,
	itemCatalog: ItemCatalogEntry[],
	provenanceByItemId: ReadonlyMap<number, EntityProvenance>,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const itemId = getFormInteger(form, 'itemId', Number.NaN);
	const itemNum = getAdminItemQuantity(form, 'itemNum', 1);
	const item = itemCatalog.find((entry) => entry.itemId === itemId);
	const provenance = provenanceByItemId.get(itemId);
	if (
		playerId.length === 0 ||
		!item ||
		provenance === undefined ||
		itemNum === undefined ||
		isSiscaItemId(item.itemId)
	) {
		return false;
	}
	ensureEmptyUserInventory(state, playerId);
	return (
		addUserItemQuantity(state, playerId, item, itemNum, provenance) !==
		undefined
	);
}

export function maxAllUserItemsFromForm(
	form: AdminForm,
	state: ServerState,
	itemCatalog: ItemCatalogEntry[],
	userStatusController: UserStatusController,
	provenanceByItemId: ReadonlyMap<number, EntityProvenance>,
): number | undefined {
	const playerId = getFormString(form, 'playerId');
	if (playerId.length === 0) {
		return undefined;
	}
	const user = state.registeredUsers.find(
		(registeredUser) => registeredUser.playerId === playerId,
	);
	if (!user) {
		return undefined;
	}
	const maxItems: Array<{ item: ItemCatalogEntry; itemNum: number }> = [];
	for (const item of itemCatalog) {
		const itemNum = maxItemQuantity(item);
		if (itemNum === undefined) {
			return undefined;
		}
		if (!isSiscaItemId(item.itemId) && !provenanceByItemId.has(item.itemId)) {
			return undefined;
		}
		maxItems.push({ item, itemNum });
	}
	const inventory = ensureEmptyUserInventory(state, playerId);
	for (const { item } of maxItems) {
		if (isSiscaItemId(item.itemId)) continue;
		const existing = inventory.itemCategoryList
			.flatMap((category) => category.userItemList)
			.find((userItem) => userItem.itemId === item.itemId);
		if (existing !== undefined) {
			assertUserItemIdentity(
				existing,
				item.itemId,
				provenanceByItemId.get(item.itemId),
			);
		}
	}
	const userStatus = userStatusController.ensure(state, playerId).value;
	let changedCount = 0;
	for (const { item, itemNum } of maxItems) {
		if (isFreeSiscaItemId(item.itemId)) {
			userStatus.jewelFree = itemNum;
		} else if (isPaidSiscaItemId(item.itemId)) {
			if (user.platformType === 2) {
				userStatus.jewelPaidApple = itemNum;
			} else {
				userStatus.jewelPaidGoogle = itemNum;
			}
		} else {
			const provenance = provenanceByItemId.get(item.itemId);
			if (provenance === undefined) {
				return undefined;
			}
			setUserItemQuantity(inventory, item, itemNum, provenance);
		}
		changedCount += 1;
	}
	return changedCount;
}

function maxItemQuantity(item: ItemCatalogEntry): number | undefined {
	if (!Number.isSafeInteger(item.limitNum) || item.limitNum <= 0) {
		return undefined;
	}
	return item.limitNum;
}
