import { z } from 'zod';
import type { StandardQuestAdminAreaMaster } from '../../../../../src/master-data/standard-quest-admin-master-data.ts';

const standardQuestStageSchema = z.object({
	stageId: z.number(),
	name: z.string(),
	description: z.string(),
	stageType: z.number(),
	useType: z.number(),
	useItem: z.number(),
	useNum: z.number(),
	questMusicsType: z.number(),
	questMusicsDetail: z.number(),
	questLevel: z.number(),
	score1: z.number(),
	score2: z.number(),
	score3: z.number(),
});

export const standardQuestAreaSchema: z.ZodType<StandardQuestAdminAreaMaster> =
	z.object({
		areaId: z.number(),
		name: z.string(),
		number: z.number(),
		description: z.string(),
		orderId: z.number(),
		generationId: z.number(),
		startDate: z.string(),
		endDate: z.string(),
		stages: z.array(standardQuestStageSchema),
	});
