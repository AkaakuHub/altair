import type { UserInventoryState } from '../state/user-item-definition.ts';
import { ensurePositiveItemPickupTime } from '../state/user-item-provenance.ts';

export function migrateUserInventoryState(inventory: UserInventoryState): void {
	for (const category of inventory.itemCategoryList) {
		for (const item of category.userItemList) {
			item.itemCategory ??= category.itemCategory;
			ensurePositiveItemPickupTime(item);
		}
	}
}
