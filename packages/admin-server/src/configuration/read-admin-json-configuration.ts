import { readFileSync } from 'node:fs';

export function readAdminJsonConfiguration(path: string): unknown {
	return JSON.parse(readFileSync(path, 'utf8'));
}
