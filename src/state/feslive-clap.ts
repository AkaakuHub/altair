import { z } from 'zod';

export const fesliveClapSchema = z.object({
	normal: z.object({ step: z.number().int() }),
	mission: z.object({ step: z.number().int(), rate_to_next: z.number().int() }),
	is_mission_ongoing: z.boolean(),
});

export type FesliveClap = z.infer<typeof fesliveClapSchema>;

export function createFesliveClap(): FesliveClap {
	return {
		normal: { step: 0 },
		mission: { step: 0, rate_to_next: 0 },
		is_mission_ongoing: false,
	};
}
