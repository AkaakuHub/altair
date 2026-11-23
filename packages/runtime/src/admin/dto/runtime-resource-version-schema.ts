import { z } from 'zod';

export const runtimeReleaseOptionSchema = z.object({
	clientVersion: z.string().min(1),
	resourceVersion: z.string().min(1),
	id: z.string(),
	platform: z.enum(['android', 'ios']),
	revision: z.string(),
	isActive: z.boolean(),
});
export type RuntimeReleaseOption = z.infer<typeof runtimeReleaseOptionSchema>;
export type RuntimeResourceOptionIds = Readonly<{
	android: string;
	ios: string;
}>;
