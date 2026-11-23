import type { Database } from 'bun:sqlite';
import {
	getCardIdentityFingerprint,
	getItemIdentityFingerprint,
} from '../master-data/entity-identity-fingerprints.ts';
import type { EntityProvenance } from '../state/entity-provenance.ts';

export function createPresentRewardProvenance(
	database: Database,
	masterReleaseId: string,
	itemId: number,
	itemType: number,
): EntityProvenance {
	const identityFingerprint =
		itemType === 2
			? getCardIdentityFingerprint(database, itemId)
			: getItemIdentityFingerprint(database, itemId);
	if (identityFingerprint === undefined) {
		throw new Error(`present reward fingerprint not found: ${itemId}`);
	}
	return { sourceMasterReleaseId: masterReleaseId, identityFingerprint };
}
