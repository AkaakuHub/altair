import { z } from 'zod';
import type { GradeChallengeAdminSummaryMaster } from '../../../../../src/master-data/grade-challenge-admin-master-data.ts';

export const gradeChallengeSummarySchema: z.ZodType<GradeChallengeAdminSummaryMaster> =
	z.object({
		gradeChallengeSeasonId: z.number(),
		name: z.string(),
		giveSeasonGradeId: z.number(),
		bgImageId: z.number(),
		startDate: z.string(),
		endDate: z.string(),
		isRankingPrize: z.number(),
	});

export type GradeChallengeSummary = z.infer<typeof gradeChallengeSummarySchema>;
