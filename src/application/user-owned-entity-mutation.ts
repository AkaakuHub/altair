import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import {
	classifyEntityCompatibility,
	type EntityCompatibility,
} from './entity-compatibility-catalog.ts';

export function classifyOwnedEntityMutation(
	definitionId: number,
	storedFingerprint: EntityIdentityFingerprint | undefined,
	targetFingerprint: EntityIdentityFingerprint | undefined,
): EntityCompatibility {
	if (storedFingerprint === undefined) {
		return targetFingerprint === undefined ? 'absent' : 'changed';
	}
	return classifyEntityCompatibility(
		definitionId,
		storedFingerprint,
		targetFingerprint,
	).compatibility;
}
