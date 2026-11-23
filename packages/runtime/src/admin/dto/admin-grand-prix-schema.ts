import { z } from 'zod';
import type {
	EmptyGrandPrixAdminDetailMaster,
	GrandPrixAdminDetailMaster,
	GrandPrixAdminSummaryMaster,
} from '../../../../../src/master-data/grand-prix-admin-master-data.ts';

const grandPrixStageDetailSchema = z.object({
	stageId: z.number(),
	name: z.string(),
	orderId: z.number(),
	questMusicsType: z.number(),
	questMusicsDetail: z.number(),
	overrideQuestMusicsDetail: z.number().nullable(),
});

const grandPrixSeriesDetailSchema = z.object({
	seriesId: z.number(),
	name: z.string(),
	orderId: z.number(),
	stages: z.array(grandPrixStageDetailSchema),
});

const grandPrixFullDetailSchema: z.ZodType<GrandPrixAdminDetailMaster> =
	z.object({
		grandPrixId: z.number(),
		series: z.array(grandPrixSeriesDetailSchema),
		rhythmGameSeries: z.array(
			z.object({
				seriesId: z.number(),
				orderId: z.number(),
				questMusicsType: z.number(),
				questMusicsDetail: z.number(),
				music: z.discriminatedUnion('status', [
					z.object({
						status: z.literal('resolved'),
						musicId: z.number(),
						soundId: z.number(),
					}),
					z.object({
						status: z.literal('unresolved'),
						musicId: z.number().nullable(),
						reason: z.enum([
							'quest-music-type-unresolved',
							'music-master-missing',
						]),
					}),
				]),
				unresolvedFields: z.tuple([
					z.literal('name'),
					z.literal('description'),
				]),
			}),
		),
		rewards: z.array(
			z.object({
				rewardId: z.number(),
				grandPrixRewardType: z.number(),
				minTargetNum: z.number(),
				maxTargetNum: z.number(),
				isDisplay: z.boolean(),
				rewardDatas: z.array(
					z.object({
						rewardDataId: z.number(),
						rewardType: z.number(),
						rewardItemId: z.number(),
						rewardNum: z.number(),
						unresolvedFields: z.tuple([
							z.literal('isEmphasize'),
							z.literal('isUsePresentBox'),
							z.literal('lifeTimeDay'),
							z.literal('rewardTextId'),
						]),
					}),
				),
			}),
		),
	});

const emptyGrandPrixDetailSchema: z.ZodType<EmptyGrandPrixAdminDetailMaster> =
	z.object({
		series: z.tuple([]),
		rhythmGameSeries: z.tuple([]),
		rewards: z.tuple([]),
	});

export const grandPrixDetailSchema = z.union([
	grandPrixFullDetailSchema,
	emptyGrandPrixDetailSchema,
]);

export const grandPrixSummarySchema: z.ZodType<GrandPrixAdminSummaryMaster> =
	z.object({
		grandPrixId: z.number(),
		grandPrixType: z.number(),
		name: z.string(),
		description: z.string(),
		startDate: z.string(),
		endDate: z.string(),
		questCount: z.number(),
		stageCount: z.number(),
		rewardCount: z.number(),
	});

export const musicLevelBoundarySchema = z.object({
	level: z.number(),
	experience: z.number(),
	cumulativeExperience: z.number(),
});

export type GrandPrixSummary = z.infer<typeof grandPrixSummarySchema>;
export type MusicLevelBoundary = z.infer<typeof musicLevelBoundarySchema>;
