import { z } from 'zod';

export const savedResourceTargetSchema = z
	.object({
		source: z.literal('resource'),
		clientVersion: z.string().min(1),
		resourceVersion: z.string().min(1),
	})
	.strict();

export const runtimeResourceSelectionSchema = z
	.object({
		android: savedResourceTargetSchema,
		ios: savedResourceTargetSchema,
	})
	.strict();

export type RuntimeResourceSelection = z.infer<
	typeof runtimeResourceSelectionSchema
>;
