import { z } from 'zod';
import type { GradeLiveAdminSummaryMaster } from '../../../../../src/master-data/grade-live-admin-master-data.ts';

export const gradeLiveSummarySchema: z.ZodType<GradeLiveAdminSummaryMaster> =
	z.object({
		gradeQuestSeasonId: z.number(),
		name: z.string(),
		orderId: z.number(),
		generation: z.number(),
		season: z.number(),
		startDate: z.string(),
		endDate: z.string(),
	});

export type GradeLiveSummary = z.infer<typeof gradeLiveSummarySchema>;
