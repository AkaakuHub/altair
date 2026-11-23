import { describe, expect, test } from 'bun:test';
import {
	findGrandPrixRankingState,
	updateGrandPrixRankingsFromProgress,
} from '../src/state/grand-prix-ranking-aggregate.ts';

const master = (value: string) => ({
	identityFingerprint: { domain: 'grand-prix', value },
	schoolStageSeries: [],
	rhythmGameSeriesIds: [],
	rhythmGameSeriesIdentityFingerprints: new Map(),
});

describe('grand prix ranking version', () => {
	test('retains legacy and independent same-id ranking aggregates', () => {
		const legacy = {
			grandPrixId: 10,
			personalRankings: [{ playerId: 'player', rank: 1, point: 100 }],
			circleRankings: [],
		};
		const state = {
			grandPrixRankings: [legacy],
			registeredUsers: [],
			userLives: [],
			circle: null,
		};
		updateGrandPrixRankingsFromProgress(state, 10, master('old'), 'old');
		updateGrandPrixRankingsFromProgress(state, 10, master('new'), 'new');

		expect(state.grandPrixRankings).toHaveLength(3);
		expect(state.grandPrixRankings).toContain(legacy);
		expect(
			findGrandPrixRankingState(state, 10, master('old').identityFingerprint),
		).toMatchObject({
			sourceMasterReleaseId: 'old',
			identityFingerprint: master('old').identityFingerprint,
		});
		expect(
			findGrandPrixRankingState(state, 10, master('new').identityFingerprint),
		).toMatchObject({
			sourceMasterReleaseId: 'new',
			identityFingerprint: master('new').identityFingerprint,
		});
	});
});
