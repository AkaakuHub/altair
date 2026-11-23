import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { completeResourceVersionSchema } from '../master-archive/domain/resource-version.ts';

const selectedMasterReleaseSchema = z
	.object({
		schemaVersion: z.literal(1),
		releaseId: z.string().regex(/^[0-9a-f]{64}$/u),
		databaseFingerprint: z.string().regex(/^[0-9a-f]{64}$/u),
		androidResourceVersion: completeResourceVersionSchema,
		iosResourceVersion: completeResourceVersionSchema,
	})
	.strict();

export type SelectedMasterRelease = z.infer<typeof selectedMasterReleaseSchema>;

export function readSelectedMasterRelease(path: string): SelectedMasterRelease {
	return parseSelectedMasterRelease(JSON.parse(readFileSync(path, 'utf8')));
}

export function parseSelectedMasterRelease(
	value: unknown,
): SelectedMasterRelease {
	return selectedMasterReleaseSchema.parse(value);
}
