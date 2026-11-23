import { join } from 'node:path';
import { readRequiredEnvironmentPath } from '../../src/configuration/environment.ts';

export function externalFixturePath(...segments: readonly string[]): string {
	return join(
		readRequiredEnvironmentPath(process.env, 'ALTAIR_TEST_DATA_ROOT'),
		'inputs',
		'test-fixtures',
		...segments,
	);
}
