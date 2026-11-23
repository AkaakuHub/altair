import type { ServerRuntimeDefaults } from '../src/server-runtime-defaults.ts';

export const testServerRuntimeDefaults: ServerRuntimeDefaults = {
	chapter: { activeChapterId: 1, startDate: '', endDate: '' },
	grandPrix: {
		activeGrandPrixId: 1,
		grandPrixType: 1,
		startDate: '',
		endDate: '',
		status: 0,
		dailyPlayableCount: 0,
		guildTotalPoint: 0,
		guildRanking: 0,
		withinGuildRanking: 0,
		personalTotalPoint: 0,
		personalRanking: 0,
		stageOverrides: [],
	},
	gradeChallenge: {
		activeGradeChallengeSeasonId: 1,
		startDate: '',
		endDate: '',
		status: 0,
	},
	gradeLive: {
		activeGradeQuestSeasonId: 1,
		startDate: '',
		endDate: '',
		status: 0,
	},
};
