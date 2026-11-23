import { z } from 'zod';

export const runtimeMaintenanceStateSchema = z.object({
	schemaVersion: z.literal(1),
	enabled: z.boolean(),
	androidResourceVersion: z.string(),
	iosResourceVersion: z.string(),
});
export type RuntimeMaintenanceState = Readonly<
	z.infer<typeof runtimeMaintenanceStateSchema>
>;
