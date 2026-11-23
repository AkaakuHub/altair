import type {
	UserInventoryState,
	UserItemCategoryState,
	UserItemState,
} from '../../../../../../src/state/user-item-definition.ts';
import {
	type JsonRecord,
	readNumber,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function createInventoryFromResponse(
	playerId: string,
	response: JsonRecord | undefined,
): UserInventoryState | null {
	if (response === undefined) {
		return null;
	}
	const categories = readRecordArray(response.item_category_list)
		.map(createItemCategory)
		.filter((category): category is UserItemCategoryState => category !== null);
	if (categories.length === 0 && !Array.isArray(response.item_category_list)) {
		return null;
	}
	const itemCount = categories.reduce(
		(total, category) => total + category.userItemList.length,
		0,
	);
	if (itemCount === 0) {
		return null;
	}
	return { playerId, itemCategoryList: categories };
}

function createItemCategory(
	category: JsonRecord,
): UserItemCategoryState | null {
	const itemCategory = readNumber(category.item_category);
	if (itemCategory === null) {
		return null;
	}
	return {
		itemCategory,
		userItemList: readRecordArray(category.user_item_list)
			.map(createUserItem)
			.filter((item): item is UserItemState => item !== null),
	};
}

function createUserItem(item: JsonRecord): UserItemState | null {
	const userItemId = readString(item.user_item_id);
	const itemId = readNumber(item.item_id);
	const itemNum = readNumber(item.item_num);
	const itemType = readNumber(item.item_type);
	const rarity = readNumber(item.rarity);
	const resourceFileName =
		typeof item.resource_file_name === 'string'
			? item.resource_file_name
			: null;
	if (
		userItemId === null ||
		itemId === null ||
		itemNum === null ||
		itemType === null ||
		rarity === null ||
		resourceFileName === null
	) {
		return null;
	}
	const pickupTime = readString(item.pickup_time);
	return {
		userItemId,
		itemId,
		itemNum,
		itemType,
		...(pickupTime !== null ? { pickupTime } : {}),
		limitDateTime: readString(item.limit_date_time),
		rarity,
		resourceFileName,
	};
}
