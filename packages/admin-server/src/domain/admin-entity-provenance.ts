import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from '../../../../src/state/entity-provenance.ts';

export function createProvenanceByDefinitionId(
	masterReleaseId: string,
	fingerprints: ReadonlyMap<number, EntityIdentityFingerprint>,
): ReadonlyMap<number, EntityProvenance> {
	return new Map(
		[...fingerprints].map(([definitionId, identityFingerprint]) => [
			definitionId,
			{ sourceMasterReleaseId: masterReleaseId, identityFingerprint },
		]),
	);
}
