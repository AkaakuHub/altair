import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import {
	activeMasterQueryManifestSize,
	createActiveMasterQueryTestSchema,
} from './active-master-query-test-schema.ts';

describe('active master query contract', () => {
	test('production queryをgenerated read model schemaへ全件prepareできる', async () => {
		const database = new Database(':memory:');
		try {
			const queries = await createActiveMasterQueryTestSchema(database);
			for (const query of queries) {
				try {
					database.prepare(query.sql);
				} catch (error) {
					throw new Error(
						`Active master query contract failed at ${query.source}: ${query.sql}`,
						{ cause: error },
					);
				}
			}
		} finally {
			database.close();
		}
		expect(activeMasterQueryManifestSize()).toBeGreaterThan(75);
	});

	test('manifestはgeneratorとhook以外から手動更新されない', async () => {
		const packageJson = await Bun.file(
			new URL('../package.json', import.meta.url),
		).json();
		const prePushHook = await Bun.file(
			new URL('../.githooks/pre-push', import.meta.url),
		).text();
		expect(packageJson.scripts['master-query-manifest:check']).toBe(
			'bun src/cli/generate-active-master-query-manifest.ts --check',
		);
		expect(prePushHook).toContain('bun run master-query-manifest:check');
	});
});
