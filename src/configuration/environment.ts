import { isAbsolute, normalize } from 'node:path';
import { z } from 'zod';

export const absolutePathSchema = z
	.string()
	.min(1)
	.refine(
		(path) => isAbsolute(path) && normalize(path) === path,
		'Path must be absolute and normalized',
	);

export function readRequiredEnvironmentPath(
	environment: NodeJS.ProcessEnv,
	name: string,
): string {
	const value = environment[name];
	if (value === undefined) throw new Error(`${name} is required`);
	return absolutePathSchema.parse(value);
}

export function readOptionalEnvironmentPath(
	environment: NodeJS.ProcessEnv,
	name: string,
): string | undefined {
	const value = environment[name];
	return value === undefined ? undefined : absolutePathSchema.parse(value);
}
