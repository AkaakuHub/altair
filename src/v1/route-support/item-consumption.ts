import type { Database } from 'bun:sqlite';
import { getItemIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import type { EntityProvenance } from '../../state/entity-provenance.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import {
	consumeUserItems,
	type UserItemConsumption,
} from '../../state/user-item-mutation.ts';

type ItemConsumptionInput = Omit<UserItemConsumption, 'provenance'>;

export function createMasterReleaseItemProvenance(
	database: Database,
	masterReleaseId: string,
	itemId: number,
): EntityProvenance | undefined {
	const identityFingerprint = getItemIdentityFingerprint(database, itemId);
	return identityFingerprint === undefined
		? undefined
		: { sourceMasterReleaseId: masterReleaseId, identityFingerprint };
}

export function consumeMasterReleaseUserItems(
	database: Database,
	masterReleaseId: string,
	inventory: UserInventoryState,
	inputs: readonly ItemConsumptionInput[],
): boolean {
	const consumptions: UserItemConsumption[] = [];
	for (const input of inputs) {
		const identityFingerprint = getItemIdentityFingerprint(
			database,
			input.itemId,
		);
		if (identityFingerprint === undefined) return false;
		consumptions.push({
			...input,
			provenance: {
				sourceMasterReleaseId: masterReleaseId,
				identityFingerprint,
			},
		});
	}
	return consumeUserItems(inventory, consumptions);
}
