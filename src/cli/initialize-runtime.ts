import { readFile } from 'node:fs/promises';
import { isAbsolute, normalize } from 'node:path';
import { runtimeInitializationConfigurationSchema } from '../runtime-initialization/configuration.ts';
import { initializeRuntime } from '../runtime-initialization/initialize-runtime.ts';

const path = Bun.argv[2];
if (
	Bun.argv.length !== 3 ||
	path === undefined ||
	!isAbsolute(path) ||
	normalize(path) !== path
)
	throw new Error('Usage: runtime:initialize <absolute-configuration-path>');
const configuration = runtimeInitializationConfigurationSchema.parse(
	JSON.parse(await readFile(path, 'utf8')),
);
const result = await initializeRuntime(configuration);
console.log(JSON.stringify(result, null, 2));
