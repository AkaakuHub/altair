import type { Database } from 'bun:sqlite';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import type { SiscaStoreMaster } from '../../state/sisca-store-master.ts';
import type {
	SiscaStoreItemState,
	UserSiscaStoreState,
} from '../../state/sisca-store-state.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import type {
	UserInventoryState,
	UserItemState,
} from '../../state/user-item-definition.ts';
import type {
	SiscaStoreListResponse,
	SiscaStorePurchaseResponse,
} from '../response-types/shop-inventory-response-types.ts';

export function createSiscaStoreListResponse(
	database: Database,
	store: UserSiscaStoreState,
	master: SiscaStoreMaster,
	inventory: UserInventoryState,
): SiscaStoreListResponse {
	return {
		item_list: master.itemList.map((masterItem) => {
			const item = store.itemList.find(
				(state) => state.siscaStoreDatasId === masterItem.siscaStoreDatasId,
			) ?? {
				buyableNum: masterItem.limitNum > 0 ? masterItem.limitNum : -1,
				isNewItem: false,
				isSale: true,
			};
			return {
				buyable_num: createSiscaStoreBuyableNum(
					database,
					item,
					masterItem,
					inventory,
				),
				is_new_item: item.isNewItem,
				is_sale: item.isSale,
				own_num:
					findUserItemByItemId(inventory, masterItem.itemId)?.itemNum ?? 0,
				sisca_store_datas_id: masterItem.siscaStoreDatasId,
			};
		}),
	};
}

export function createSiscaStorePurchaseResponse(
	freeSisca: number,
	paidSisca: number,
	userItem: UserItemState,
): SiscaStorePurchaseResponse {
	return {
		sisca_info: {
			free: freeSisca,
			paid: paidSisca,
		},
		user_item_info: {
			item_id: userItem.itemId,
			item_num: userItem.itemNum,
			limit_date_time: userItem.limitDateTime,
			user_item_id: userItem.userItemId,
		},
	};
}

function createSiscaStoreBuyableNum(
	database: Database,
	item: Pick<SiscaStoreItemState, 'buyableNum'>,
	masterItem: SiscaStoreMaster['itemList'][number],
	inventory: UserInventoryState,
): number {
	if (item.buyableNum === 0) {
		return item.buyableNum;
	}
	const itemDefinition = getItemDefinitionByItemIdFromDatabase(
		database,
		masterItem.itemId,
	);
	if (itemDefinition === undefined) {
		throw new Error(
			`SIsCa store item definition not found: ${masterItem.itemId}`,
		);
	}
	if (itemDefinition.limitNum <= 0) {
		return item.buyableNum;
	}
	const currentNum =
		findUserItemByItemId(inventory, masterItem.itemId)?.itemNum ?? 0;
	const itemLimitBuyableNum = Math.max(
		0,
		Math.floor((itemDefinition.limitNum - currentNum) / masterItem.itemNum),
	);
	if (item.buyableNum < 0) {
		return itemLimitBuyableNum;
	}
	return Math.min(item.buyableNum, itemLimitBuyableNum);
}
