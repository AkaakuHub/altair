import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import { isRecord } from './json-state-utils.ts';
import type {
	UserInventoryState,
	UserItemCategoryState,
	UserItemState,
} from './user-item-definition.ts';
import { ensurePositiveItemPickupTime } from './user-item-provenance.ts';

export function ensureUserInventory(
	state: { userInventories: UserInventoryState[] },
	playerId: string,
	seed: unknown,
): EnsureStateResult<UserInventoryState> {
	const existing = findUserInventory(state, playerId);
	if (existing) {
		return { value: existing, created: false };
	}
	const inventory = {
		playerId,
		itemCategoryList: readSeedItemCategories(seed),
	};
	state.userInventories = [...state.userInventories, inventory];
	return { value: inventory, created: true };
}
export function ensureEmptyUserInventory(
	state: ServerState,
	playerId: string,
): UserInventoryState {
	const existing = findUserInventory(state, playerId);
	if (existing) return existing;
	const inventory = { playerId, itemCategoryList: [] };
	state.userInventories = [...state.userInventories, inventory];
	return inventory;
}
export function findUserInventory(
	state: { userInventories: UserInventoryState[] },
	playerId: string,
): UserInventoryState | undefined {
	return state.userInventories.find(
		(inventory) => inventory.playerId === playerId,
	);
}
export function findUserItemByItemId(
	inventory: UserInventoryState,
	itemId: number,
): UserItemState | undefined {
	return inventory.itemCategoryList
		.flatMap((category) => category.userItemList)
		.find((item) => item.itemId === itemId);
}
export function findUserItemByUserItemId(
	inventory: UserInventoryState,
	userItemId: string,
): UserItemState | undefined {
	return inventory.itemCategoryList
		.flatMap((category) => category.userItemList)
		.find((item) => item.userItemId === userItemId);
}
export function ensureItemCategory(
	inventory: UserInventoryState,
	itemCategory: number,
): UserItemCategoryState {
	const existing = inventory.itemCategoryList.find(
		(category) => category.itemCategory === itemCategory,
	);
	if (existing) return existing;
	const category = { itemCategory, userItemList: [] };
	inventory.itemCategoryList = [...inventory.itemCategoryList, category];
	return category;
}
function readSeedItemCategories(seed: unknown): UserItemCategoryState[] {
	if (!isRecord(seed) || !Array.isArray(seed.item_category_list))
		throw new Error('user_items_get_list seed must have item_category_list');
	return seed.item_category_list.map(readSeedItemCategory);
}
function readSeedItemCategory(value: unknown): UserItemCategoryState {
	if (!isRecord(value) || !Array.isArray(value.user_item_list))
		throw new Error('user_items_get_list seed has invalid item category');
	const itemCategory = readNumber(value.item_category);
	return {
		itemCategory,
		userItemList: value.user_item_list.map((item) => ({
			...readSeedUserItem(item),
			itemCategory,
		})),
	};
}
function readSeedUserItem(value: unknown): UserItemState {
	if (!isRecord(value))
		throw new Error('user_items_get_list seed has invalid user item');
	const item: UserItemState = {
		userItemId: readString(value.user_item_id),
		itemId: readNumber(value.item_id),
		itemNum: readNumber(value.item_num),
		itemType: readNumber(value.item_type),
		limitDateTime: readNullableString(value.limit_date_time),
		rarity: readNumber(value.rarity),
		resourceFileName: readString(value.resource_file_name),
	};
	if (typeof value.pickup_time === 'string')
		item.pickupTime = value.pickup_time;
	ensurePositiveItemPickupTime(item);
	return item;
}
function readNumber(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value))
		throw new Error('user_items_get_list seed has invalid number');
	return value;
}
function readString(value: unknown): string {
	if (typeof value !== 'string')
		throw new Error('user_items_get_list seed has invalid string');
	return value;
}
function readNullableString(value: unknown): string | null {
	if (value === null || typeof value === 'string') return value;
	throw new Error('user_items_get_list seed has invalid nullable string');
}
