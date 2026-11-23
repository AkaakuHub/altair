import { isAbsolute, normalize } from 'node:path';
import { z } from 'zod';

const absolutePath = z
	.string()
	.min(1)
	.refine(
		(path) => isAbsolute(path) && normalize(path) === path,
		'Path must be absolute and normalized',
	);
export const runtimeInitializationConfigurationSchema = z
	.object({
		activeDatabasePath: absolutePath,
		selectedReleasePath: absolutePath,
		androidManifestPath: absolutePath,
		iosManifestPath: absolutePath,
	})
	.strict();
export type RuntimeInitializationConfiguration = z.infer<
	typeof runtimeInitializationConfigurationSchema
>;
