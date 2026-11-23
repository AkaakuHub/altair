import { describe, expect, test } from 'bun:test';
import { createGrandPrixIdentityFingerprint } from '../src/master-data/grand-prix-identity.ts';

describe('grand prix identity', () => {
	test('uses playable structure without schedule or ranking reward balance', () => {
		const structure = {
			grandPrixId: 10,
			schoolStageFingerprints: [
				{ domain: 'grand-prix-quest-stage', value: 'stage' },
			],
			rhythmSeriesFingerprints: [
				{ domain: 'rhythm-game-grand-prix-series', value: 'rhythm' },
			],
		};
		expect(createGrandPrixIdentityFingerprint(structure)).toEqual(
			createGrandPrixIdentityFingerprint({ ...structure }),
		);
		expect(
			createGrandPrixIdentityFingerprint({
				...structure,
				rhythmSeriesFingerprints: [
					{ domain: 'rhythm-game-grand-prix-series', value: 'changed' },
				],
			}),
		).not.toEqual(createGrandPrixIdentityFingerprint(structure));
	});
});
