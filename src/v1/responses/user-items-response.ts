import { ICON_FRAME_ITEM_TYPE } from '../../state/item-types.ts';
import type {
	UserIconFrameState,
	UserInventoryState,
	UserItemState,
} from '../../state/user-item-definition.ts';
import type {
	ItemDetailTemplateResponse,
	UserItemDetailResponse,
	UserItemsResponse,
} from '../response-types/shop-inventory-response-types.ts';

export function createUserItemsResponse(
	inventory: UserInventoryState,
): UserItemsResponse {
	return {
		item_category_list: inventory.itemCategoryList.map((category) => ({
			item_category: category.itemCategory,
			user_item_list: category.userItemList.map((item) => ({
				item_id: item.itemId,
				item_num: item.itemNum,
				item_type: item.itemType,
				limit_date_time: item.limitDateTime,
				rarity: item.rarity,
				resource_file_name: item.resourceFileName,
				user_item_id: item.userItemId,
			})),
		})),
	};
}

export function createUserItemDetailResponse(
	item: UserItemState,
	detailTemplate: ItemDetailTemplateResponse,
): UserItemDetailResponse {
	return {
		...structuredClone(detailTemplate),
		d_item_datas_id: item.userItemId,
		item_num: item.itemNum,
		item_type: item.itemType,
		limit_date_time: item.limitDateTime,
		rarity: item.rarity,
		resource_file_name: item.resourceFileName,
		user_item_id: item.userItemId,
	};
}

export function createUserIconFrameList(
	inventory: UserInventoryState,
): UserIconFrameState[] {
	return inventory.itemCategoryList
		.flatMap((category) => category.userItemList)
		.filter(
			(item) => item.itemType === ICON_FRAME_ITEM_TYPE && item.itemNum > 0,
		)
		.map((item) => {
			if (item.pickupTime === undefined) {
				throw new Error(`icon frame pickup time not found: ${item.itemId}`);
			}
			return {
				frame_id: item.itemId,
				pickup_time: item.pickupTime,
			};
		})
		.sort((left, right) => left.frame_id - right.frame_id);
}
