import type {
	UserInventoryState,
	UserItemState,
} from '../../state/user-item-definition.ts';

export type UserItemLookup = ReadonlyMap<number, UserItemState>;

export function getCardGrowthStringField(body: unknown, name: string): string {
	if (typeof body !== 'object' || body === null || Array.isArray(body))
		return '';
	const value = (body as Record<string, unknown>)[name];
	if (typeof value === 'string') return value;
	return typeof value === 'number' && Number.isInteger(value)
		? String(value)
		: '';
}

export function getCardGrowthNumberField(
	body: unknown,
	name: string,
): number | undefined {
	if (typeof body !== 'object' || body === null || Array.isArray(body))
		return undefined;
	const value = (body as Record<string, unknown>)[name];
	return typeof value === 'number' ? value : undefined;
}

export function createUserItemLookup(
	inventory: UserInventoryState,
): UserItemLookup {
	const itemByItemId = new Map<number, UserItemState>();
	for (const category of inventory.itemCategoryList) {
		for (const item of category.userItemList) {
			if (!itemByItemId.has(item.itemId)) {
				itemByItemId.set(item.itemId, item);
			}
		}
	}
	return itemByItemId;
}

export function getOwnItemNum(
	itemLookup: UserItemLookup,
	itemId: number,
): number {
	return itemLookup.get(itemId)?.itemNum ?? 0;
}

export function consumeUserItemFromLookup(
	itemLookup: UserItemLookup,
	itemId: number,
	itemNum: number,
): boolean {
	if (itemNum <= 0) {
		return false;
	}
	const item = itemLookup.get(itemId);
	if (!item || item.itemNum < itemNum) {
		return false;
	}
	item.itemNum -= itemNum;
	return true;
}

export function uniqueNumbers(values: number[]): number[] {
	return [...new Set(values)];
}
