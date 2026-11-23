import type { Database } from 'bun:sqlite';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import type { GachaReceiptItemState } from '../../state/gacha-guarantee-types.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import { canAddUserItemQuantity } from '../../state/user-item-mutation.ts';

const CARD_ITEM_TYPE = 2;

export function canReceiveItemFromDatabase(
	database: Database,
	inventory: UserInventoryState,
	itemId: number,
	itemNum: number,
): boolean {
	const definition = getItemDefinitionByItemIdFromDatabase(database, itemId);
	return (
		definition !== undefined &&
		canAddUserItemQuantity(inventory, definition, itemNum)
	);
}

export function canReceiveGachaReceiptItems(
	database: Database,
	inventory: UserInventoryState,
	receiptItems: readonly GachaReceiptItemState[],
): boolean {
	const itemNums = new Map<number, number>();
	for (const receiptItem of receiptItems) {
		if (receiptItem.get_num <= 0) {
			return false;
		}
		if (receiptItem.get_item_type === CARD_ITEM_TYPE) {
			continue;
		}
		itemNums.set(
			receiptItem.get_id,
			(itemNums.get(receiptItem.get_id) ?? 0) + receiptItem.get_num,
		);
	}
	for (const [itemId, itemNum] of itemNums) {
		const definition = getItemDefinitionByItemIdFromDatabase(database, itemId);
		if (definition === undefined) {
			return false;
		}
		const currentNum = findUserItemByItemId(inventory, itemId)?.itemNum ?? 0;
		if (definition.limitNum > 0 && currentNum + itemNum > definition.limitNum) {
			return false;
		}
	}
	return true;
}
