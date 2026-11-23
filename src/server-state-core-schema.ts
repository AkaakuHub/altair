import { z } from 'zod';
import type { ResourceVersionOverrides } from './resource-versions.ts';

export const resourceVersionOverridesStateSchema = z
	.object({
		android: z.string().optional(),
		ios: z.string().optional(),
	})
	.transform((value): ResourceVersionOverrides => {
		const overrides: ResourceVersionOverrides = {};
		if (value.android !== undefined) {
			overrides.android = value.android;
		}
		if (value.ios !== undefined) {
			overrides.ios = value.ios;
		}
		return overrides;
	});

export const maintenanceModeStateSchema = z.object({
	isEnabled: z.boolean(),
});

export const chapterRuntimeStateSchema = z.object({
	activeChapterId: z.number(),
	startDate: z.string(),
	endDate: z.string(),
});

export const registeredUserStateSchema = z.object({
	playerId: z.string(),
	deviceSpecificId: z.string(),
	sessionToken: z.string(),
	playerName: z.string(),
	birthday: z.string(),
	entryTime: z.string(),
	lastLoginDate: z.string(),
	playerLevel: z.number(),
	platformType: z.number().optional(),
});

export const accountLinkStateSchema = z.object({
	provider: z.number(),
	playerId: z.string(),
	idToken: z.string(),
	platformType: z.number(),
});

export const grandPrixStageRuntimeOverrideSchema = z.object({
	stageId: z.number(),
	questMusicsType: z.number(),
	questMusicsDetail: z.number(),
});

export const grandPrixRuntimeStateSchema = z.object({
	activeGrandPrixId: z.number(),
	grandPrixType: z.number(),
	startDate: z.string(),
	endDate: z.string(),
	status: z.number(),
	dailyPlayableCount: z.number(),
	guildTotalPoint: z.number(),
	guildRanking: z.number(),
	withinGuildRanking: z.number(),
	personalTotalPoint: z.number(),
	personalRanking: z.number(),
	stageOverrides: z.array(grandPrixStageRuntimeOverrideSchema),
});

export const gradeLiveRuntimeStateSchema = z.object({
	activeGradeQuestSeasonId: z.number(),
	startDate: z.string(),
	endDate: z.string(),
	status: z.number(),
});

export const gradeChallengeRuntimeStateSchema = z.object({
	activeGradeChallengeSeasonId: z.number(),
	startDate: z.string(),
	endDate: z.string(),
	status: z.number(),
});
