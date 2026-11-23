import { describe, expect, test } from 'bun:test';
import { resolveCircleGrandPrixRankingMaster } from '../src/application/circle-grand-prix-ranking-service.ts';
import type { GrandPrixRuntimeState } from '../src/server-state-schema.ts';

const current = { grandPrixId: 2, name: 'current', month: 6 };
const previous = { grandPrixId: 1, name: 'previous', month: 5 };
const repository = {
	findById: () => current,
	findPrevious: () => previous,
};

describe('circle grand prix ranking service', () => {
	test('uses the current circle grand prix after it ends', () => {
		expect(
			resolveCircleGrandPrixRankingMaster(
				runtime({ grandPrixType: 2, status: 0 }),
				repository,
				new Date('2026-06-01T00:00:00.000Z'),
			),
		).toEqual(current);
	});

	test('uses the previous circle grand prix while another type is active', () => {
		expect(
			resolveCircleGrandPrixRankingMaster(
				runtime({ grandPrixType: 1, status: 2 }),
				repository,
				new Date('2026-06-01T00:00:00.000Z'),
			),
		).toEqual(previous);
	});
});

function runtime(
	overrides: Pick<GrandPrixRuntimeState, 'grandPrixType' | 'status'>,
): GrandPrixRuntimeState {
	return {
		activeGrandPrixId: 2,
		grandPrixType: overrides.grandPrixType,
		status: overrides.status,
		startDate: '2026-05-01T00:00:00.000Z',
		endDate: '2026-05-31T00:00:00.000Z',
		dailyPlayableCount: 1,
		personalRanking: 0,
		personalTotalPoint: 0,
		guildRanking: 0,
		guildTotalPoint: 0,
		withinGuildRanking: 0,
		stageOverrides: [],
	};
}
