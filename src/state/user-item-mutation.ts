import type { ServerState } from '../server-state-schema.ts';
import {
	type EntityIdentityFingerprint,
	type EntityProvenance,
	isSameEntityIdentity,
} from './entity-provenance.ts';
import {
	ensureItemCategory,
	findUserInventory,
	findUserItemByItemId,
	findUserItemByUserItemId,
} from './user-inventory-aggregate.ts';
import type {
	UserInventoryState,
	UserItemDefinition,
	UserItemState,
} from './user-item-definition.ts';
import {
	createUserItem,
	ensurePositiveItemPickupTime,
} from './user-item-provenance.ts';

export function canAddUserItemQuantity(
	inventory: UserInventoryState,
	definition: { itemId: number; limitNum: number },
	amount: number,
): boolean {
	if (amount <= 0) return false;
	const currentNum =
		findUserItemByItemId(inventory, definition.itemId)?.itemNum ?? 0;
	return definition.limitNum <= 0 || currentNum + amount <= definition.limitNum;
}
export function updateUserItemNum(
	state: ServerState,
	playerId: string,
	userItemId: string,
	itemNum: number,
): boolean {
	const inventory = findUserInventory(state, playerId);
	if (!inventory) return false;
	for (const category of inventory.itemCategoryList) {
		const item = category.userItemList.find(
			(candidate) => candidate.userItemId === userItemId,
		);
		if (item) {
			item.itemNum = itemNum;
			ensurePositiveItemPickupTime(item);
			return true;
		}
	}
	return false;
}
export function setUserItemQuantity(
	inventory: UserInventoryState,
	definition: UserItemDefinition,
	itemNum: number,
	provenance?: EntityProvenance,
): UserItemState {
	const existing = findUserItemByItemId(inventory, definition.itemId);
	if (existing) {
		assertUserItemIdentity(existing, definition.itemId, provenance);
		applyMissingUserItemProvenance(existing, provenance);
		existing.itemNum = itemNum;
		ensurePositiveItemPickupTime(existing);
		return existing;
	}
	const category = ensureItemCategory(inventory, definition.itemCategory);
	const item = createUserItem(definition, itemNum, provenance);
	category.userItemList = [...category.userItemList, item];
	return item;
}
export function consumeUserItem(
	inventory: UserInventoryState,
	userItemId: string,
	itemId: number,
	itemNum: number,
	provenance: EntityProvenance,
): boolean {
	return consumeUserItems(inventory, [
		{ userItemId, itemId, itemNum, provenance },
	]);
}

export type UserItemConsumption = {
	userItemId: string;
	itemId: number;
	itemNum: number;
	provenance: EntityProvenance;
};

export function consumeUserItems(
	inventory: UserInventoryState,
	consumptions: readonly UserItemConsumption[],
): boolean {
	const amountByItem = new Map<UserItemState, number>();
	for (const consumption of consumptions) {
		if (consumption.itemNum <= 0) return false;
		const item =
			consumption.userItemId.length > 0
				? findUserItemByUserItemId(inventory, consumption.userItemId)
				: findUserItemByItemId(inventory, consumption.itemId);
		if (
			!item ||
			item.itemId !== consumption.itemId ||
			!isSameEntityIdentity(
				item.identityFingerprint ?? legacyItemFingerprint(item),
				consumption.provenance.identityFingerprint,
			)
		) {
			return false;
		}
		amountByItem.set(item, (amountByItem.get(item) ?? 0) + consumption.itemNum);
	}
	for (const [item, amount] of amountByItem) {
		if (item.itemNum < amount) return false;
	}
	for (const [item, amount] of amountByItem) item.itemNum -= amount;
	return true;
}
export function addUserItemQuantity(
	state: { userInventories: UserInventoryState[] },
	playerId: string,
	definition: UserItemDefinition,
	amount: number,
	provenance?: EntityProvenance,
): UserItemState | undefined {
	const inventory = findUserInventory(state, playerId);
	if (!inventory || amount <= 0) return undefined;
	const existing = findUserItemByItemId(inventory, definition.itemId);
	if (existing) {
		assertUserItemIdentity(existing, definition.itemId, provenance);
		applyMissingUserItemProvenance(existing, provenance);
		existing.itemNum += amount;
		ensurePositiveItemPickupTime(existing);
		return existing;
	}
	const category = ensureItemCategory(inventory, definition.itemCategory);
	const item = createUserItem(definition, amount, provenance);
	category.userItemList = [...category.userItemList, item];
	return item;
}

export function canApplyUserItemProvenance(
	inventory: UserInventoryState,
	itemId: number,
	provenance: EntityProvenance,
): boolean {
	const existing = findUserItemByItemId(inventory, itemId);
	return (
		existing === undefined ||
		isSameEntityIdentity(
			existing.identityFingerprint ?? legacyItemFingerprint(existing),
			provenance.identityFingerprint,
		)
	);
}

export function assertUserItemIdentity(
	item: UserItemState,
	itemId: number,
	provenance: EntityProvenance | undefined,
): void {
	if (
		provenance !== undefined &&
		!isSameEntityIdentity(
			item.identityFingerprint ?? legacyItemFingerprint(item),
			provenance.identityFingerprint,
		)
	) {
		throw new Error(`user item identity mismatch: ${itemId}`);
	}
}

function applyMissingUserItemProvenance(
	item: UserItemState,
	provenance: EntityProvenance | undefined,
): void {
	if (provenance !== undefined && item.identityFingerprint === undefined) {
		item.sourceMasterReleaseId = provenance.sourceMasterReleaseId;
		item.identityFingerprint = provenance.identityFingerprint;
	}
}

function legacyItemFingerprint(
	item: UserItemState,
): EntityIdentityFingerprint | undefined {
	if (item.itemCategory === undefined) return undefined;
	return {
		domain: 'item',
		value: JSON.stringify([item.itemId, item.itemType, item.itemCategory]),
	};
}
