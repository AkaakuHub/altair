import { describe, expect, test } from 'bun:test';
import type { GrandPrixRuntimeState } from '../src/server-state-schema.ts';
import type { UserDailyQuestState } from '../src/state/daily-quest-state.ts';
import { projectHomePlayableBadges } from '../src/v1/route-support/home-playable-badge-projection.ts';

const dailyQuest: UserDailyQuestState = {
	playerId: 'player',
	userDailyTicketInfo: { num: 1, max: 3 },
	recoveryCount: 0,
	recoveryGameDate: null,
	temporaryReleaseDailyQuestSeriesIdList: [],
};
const grandPrix: GrandPrixRuntimeState = {
	activeGrandPrixId: 1,
	grandPrixType: 1,
	startDate: '',
	endDate: '',
	status: 2,
	dailyPlayableCount: 1,
	guildTotalPoint: 0,
	guildRanking: 0,
	withinGuildRanking: 0,
	personalTotalPoint: 0,
	personalRanking: 0,
	stageOverrides: [],
};

describe('home playable badge projection', () => {
	test('projects daily ticket and playable grand prix count', () => {
		expect(projectHomePlayableBadges(dailyQuest, grandPrix)).toEqual({
			hasDailyTicket: true,
			hasGrandPrixPlayableCount: true,
		});
	});

	test('clears badges after counts are exhausted', () => {
		expect(
			projectHomePlayableBadges(
				{ ...dailyQuest, userDailyTicketInfo: { num: 0, max: 3 } },
				{ ...grandPrix, dailyPlayableCount: 0 },
			),
		).toEqual({
			hasDailyTicket: false,
			hasGrandPrixPlayableCount: false,
		});
	});

	test('does not expose remaining count while grand prix is closed', () => {
		expect(
			projectHomePlayableBadges(dailyQuest, { ...grandPrix, status: 0 }),
		).toEqual({
			hasDailyTicket: true,
			hasGrandPrixPlayableCount: false,
		});
	});
});
