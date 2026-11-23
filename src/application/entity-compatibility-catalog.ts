import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';

export type EntityCompatibility = 'compatible' | 'changed' | 'absent';

export type EntityCompatibilityEntry<DefinitionId> = Readonly<{
	definitionId: DefinitionId;
	compatibility: EntityCompatibility;
	canonicalFingerprint: EntityIdentityFingerprint;
	targetFingerprint?: EntityIdentityFingerprint;
}>;

export function classifyEntityCompatibility<DefinitionId>(
	definitionId: DefinitionId,
	canonicalFingerprint: EntityIdentityFingerprint,
	targetFingerprint: EntityIdentityFingerprint | undefined,
): EntityCompatibilityEntry<DefinitionId> {
	if (targetFingerprint === undefined) {
		return { definitionId, compatibility: 'absent', canonicalFingerprint };
	}
	return {
		definitionId,
		compatibility:
			canonicalFingerprint.domain === targetFingerprint.domain &&
			canonicalFingerprint.value === targetFingerprint.value
				? 'compatible'
				: 'changed',
		canonicalFingerprint,
		targetFingerprint,
	};
}
