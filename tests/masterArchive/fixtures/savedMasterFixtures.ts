import { basename } from 'node:path';
import { externalFixturePath } from '../../externalFixtures/sourcePath.ts';

export function savedMasterFixturePath(name: string): string {
	if (name.length === 0 || basename(name) !== name)
		throw new Error('Master fixture name must be a filename');
	return externalFixturePath('master-binary', name);
}
