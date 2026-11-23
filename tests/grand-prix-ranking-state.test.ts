import { describe, expect, test } from 'bun:test';
import { assignGrandPrixRanks } from '../src/state/grand-prix-ranking-aggregate.ts';
import { getGrandPrixRankingScoreSource } from '../src/state/grand-prix-ranking-score.ts';

describe('grand prix ranking state', () => {
	test('同点は同順位とし次順位を参加数まで飛ばす', () => {
		expect(
			assignGrandPrixRanks([
				{ id: 'player-c', point: 100 },
				{ id: 'player-b', point: 200 },
				{ id: 'player-a', point: 200 },
				{ id: 'player-d', point: 50 },
			]),
		).toEqual([
			{ id: 'player-a', point: 200, rank: 1 },
			{ id: 'player-b', point: 200, rank: 1 },
			{ id: 'player-c', point: 100, rank: 3 },
			{ id: 'player-d', point: 50, rank: 4 },
		]);
	});
	test('calculates ranking points from the injected master structure', () => {
		const state = {
			userLives: [
				{
					playerId: 'player',
					grandPrixes: [
						{
							grandPrixId: 10,
							stageProgressList: [
								{
									stageId: 101,
									highScore: 0,
									dailyBestScore: 50,
									playCount: 1,
								},
								{
									stageId: 102,
									highScore: 0,
									dailyBestScore: 80,
									playCount: 1,
								},
								{
									stageId: 201,
									highScore: 0,
									dailyBestScore: 40,
									playCount: 1,
								},
							],
						},
					],
					rhythmGameGrandPrixes: [
						{
							grandPrixId: 10,
							seriesProgressList: [
								{
									grandPrixRhythmGameSeriesId: 301,
									highScore: 0,
									currentDailyPoint: 60,
									playCount: 1,
									deckCardList: [],
								},
								{
									grandPrixRhythmGameSeriesId: 302,
									highScore: 0,
									currentDailyPoint: 70,
									playCount: 1,
									deckCardList: [],
								},
							],
						},
					],
				},
			],
		};

		expect(
			getGrandPrixRankingScoreSource(state, 10, 'player', {
				identityFingerprint: { domain: 'grand-prix', value: '10' },
				schoolStageSeries: [
					{ stageIds: [101, 102], stageIdentityFingerprints: new Map() },
					{ stageIds: [201], stageIdentityFingerprints: new Map() },
				],
				rhythmGameSeriesIds: [301, 302],
				rhythmGameSeriesIdentityFingerprints: new Map(),
			}),
		).toEqual({ point: 130, contentsType: 2 });
	});
});
