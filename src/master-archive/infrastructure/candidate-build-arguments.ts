import { z } from 'zod';
import { absolutePathSchema } from '../../configuration/environment.ts';

const candidateBuildSchema = z.strictObject({
	androidManifestPath: absolutePathSchema,
	iosManifestPath: absolutePathSchema,
	candidatePath: absolutePathSchema,
	releaseId: z.string().regex(/^[0-9a-f]{64}$/u),
	kind: z.string().min(1),
});

export function parseCandidateBuildArgument(text: string) {
	return candidateBuildSchema.parse(JSON.parse(text));
}
