import type { Database } from 'bun:sqlite';
import type { EntityProvenance } from '../state/entity-provenance.ts';
import { getMusicIdentityFingerprint } from './entity-identity-fingerprints.ts';

export function requireMusicProvenance(
	database: Database,
	masterReleaseId: string,
	musicId: number,
): EntityProvenance {
	const identityFingerprint = getMusicIdentityFingerprint(database, musicId);
	if (identityFingerprint === undefined) {
		throw new Error(`music master not found: ${musicId}`);
	}
	return { sourceMasterReleaseId: masterReleaseId, identityFingerprint };
}
