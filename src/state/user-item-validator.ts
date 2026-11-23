import { isRecord } from './json-state-utils.ts';
import type {
	UserInventoryState,
	UserItemCategoryState,
	UserItemState,
} from './user-item-definition.ts';

export function isUserInventoryState(
	value: unknown,
): value is UserInventoryState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		Array.isArray(value.itemCategoryList) &&
		value.itemCategoryList.every(isUserItemCategoryState)
	);
}
function isUserItemCategoryState(
	value: unknown,
): value is UserItemCategoryState {
	return (
		isRecord(value) &&
		typeof value.itemCategory === 'number' &&
		Array.isArray(value.userItemList) &&
		value.userItemList.every(isUserItemState)
	);
}
function isUserItemState(value: unknown): value is UserItemState {
	return (
		isRecord(value) &&
		typeof value.userItemId === 'string' &&
		typeof value.itemId === 'number' &&
		typeof value.itemNum === 'number' &&
		typeof value.itemType === 'number' &&
		(value.pickupTime === undefined || typeof value.pickupTime === 'string') &&
		(value.itemCategory === undefined ||
			typeof value.itemCategory === 'number') &&
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string')) &&
		(value.limitDateTime === null || typeof value.limitDateTime === 'string') &&
		typeof value.rarity === 'number' &&
		typeof value.resourceFileName === 'string'
	);
}
