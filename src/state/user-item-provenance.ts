import { randomUUID } from 'node:crypto';
import type { EntityProvenance } from './entity-provenance.ts';
import type {
	UserItemDefinition,
	UserItemState,
} from './user-item-definition.ts';

export function createUserItem(
	definition: UserItemDefinition,
	itemNum: number,
	provenance?: EntityProvenance,
): UserItemState {
	const item: UserItemState = {
		userItemId: randomUUID(),
		itemId: definition.itemId,
		itemNum,
		itemType: definition.itemType,
		itemCategory: definition.itemCategory,
		limitDateTime: definition.limitDateTime,
		rarity: definition.rarity,
		resourceFileName: definition.resourceFileName,
	};
	if (provenance !== undefined) {
		item.sourceMasterReleaseId = provenance.sourceMasterReleaseId;
		item.identityFingerprint = provenance.identityFingerprint;
	}
	ensurePositiveItemPickupTime(item);
	return item;
}

export function ensurePositiveItemPickupTime(item: UserItemState): void {
	if (item.itemNum > 0 && item.pickupTime === undefined)
		item.pickupTime = new Date().toISOString();
}
