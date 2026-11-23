import type { Database } from 'bun:sqlite';
import type { UserOwnedMasterSupport } from '../application/user-owned-master-projection.ts';
import {
	getCardIdentityFingerprints,
	getItemIdentityFingerprints,
} from './entity-identity-fingerprints.ts';

const supportByDatabase = new WeakMap<Database, UserOwnedMasterSupport>();

export function createUserOwnedMasterSupport(
	database: Database,
): UserOwnedMasterSupport {
	const existing = supportByDatabase.get(database);
	if (existing !== undefined) {
		return existing;
	}
	const itemFingerprints = getItemIdentityFingerprints(database);
	const cardFingerprints = getCardIdentityFingerprints(database);
	const support = {
		hasItem: (itemId: number) => itemFingerprints.has(itemId),
		hasCard: (cardDatasId: number) => cardFingerprints.has(cardDatasId),
		getItemFingerprint: (itemId: number) => itemFingerprints.get(itemId),
		getCardFingerprint: (cardDatasId: number) =>
			cardFingerprints.get(cardDatasId),
	};
	supportByDatabase.set(database, support);
	return support;
}
