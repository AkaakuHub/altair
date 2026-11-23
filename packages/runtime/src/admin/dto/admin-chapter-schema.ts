import { z } from 'zod';
import type { ChapterAdminSummaryMaster } from '../../../../../src/master-data/chapter-admin-master-data.ts';

export const chapterSummarySchema: z.ZodType<ChapterAdminSummaryMaster> =
	z.object({
		chapterId: z.number(),
		chapterName: z.string(),
		startDate: z.string(),
		endDate: z.string(),
	});

export type ChapterSummary = z.infer<typeof chapterSummarySchema>;
