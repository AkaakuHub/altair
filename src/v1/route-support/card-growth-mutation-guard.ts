import type { Database } from 'bun:sqlite';
import { createCardGrowthMutationGuard } from '../../application/card-growth/card-growth-mutation-guard.ts';
import {
	getCardIdentityFingerprint,
	getItemIdentityFingerprint,
} from '../../master-data/entity-identity-fingerprints.ts';

export function createRequestCardGrowthMutationGuard(
	database: Database,
	sourceMasterReleaseId: string,
) {
	return createCardGrowthMutationGuard({
		sourceMasterReleaseId,
		getCardFingerprint: (cardDatasId) =>
			getCardIdentityFingerprint(database, cardDatasId),
		getItemFingerprint: (itemId) =>
			getItemIdentityFingerprint(database, itemId),
	});
}
