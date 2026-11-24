import { join } from 'node:path';

export const fixtureDataRoot = join(import.meta.dir, 'data');

export function externalFixturePath(...segments: readonly string[]): string {
	return join(fixtureDataRoot, 'inputs', 'test-fixtures', ...segments);
}
