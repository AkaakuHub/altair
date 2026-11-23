import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';

export function createGrandPrixIdentityFingerprint(source: {
	grandPrixId: number;
	schoolStageFingerprints: readonly EntityIdentityFingerprint[];
	rhythmSeriesFingerprints: readonly EntityIdentityFingerprint[];
}): EntityIdentityFingerprint {
	return {
		domain: 'grand-prix',
		value: JSON.stringify([
			source.grandPrixId,
			source.schoolStageFingerprints.map((value) => value.value),
			source.rhythmSeriesFingerprints.map((value) => value.value),
		]),
	};
}
