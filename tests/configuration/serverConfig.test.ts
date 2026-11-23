import { expect, test } from 'bun:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../../src/config.ts';

const environment = {
	HOST: 'localhost',
	PORT: '1',
	DATA_ROOT: join(tmpdir(), 'server-config-test'),
};

test('requires an explicit storage root, listen address and port', () => {
	for (const key of Object.keys(environment)) {
		const missing: NodeJS.ProcessEnv = { ...environment };
		delete missing[key];
		expect(() => loadConfig(missing)).toThrow();
	}
});

test('uses one supplied persistent root without assuming a home directory', () => {
	const config = loadConfig(environment);
	expect(config.root).toBe(join(environment.DATA_ROOT, 'inputs'));
	expect(config.host).toBe(environment.HOST);
	expect(config.port).toBe(Number(environment.PORT));
	expect(config.stateDbPath).toBe(join(environment.DATA_ROOT, 'state.sqlite'));
	expect(config.activeMasterDatabasePath).toBe(
		join(environment.DATA_ROOT, 'master-archive/active.sqlite'),
	);
});

test('別の作業ディレクトリでも初期所持品と登録情報の既定位置を維持する', () => {
	const previous = process.cwd();
	try {
		process.chdir(tmpdir());
		const config = loadConfig(environment);
		expect(config.officialUserInitialStateRoot).toBe(
			fileURLToPath(
				new URL('../../official-user-initial-state', import.meta.url),
			),
		);
		expect(config.resourceVersionRegistryRoot).toBe(
			join(environment.DATA_ROOT, 'inputs', 'resource-version-registry'),
		);
		expect(() =>
			loadConfig({
				...environment,
				DATA_ROOT: fileURLToPath(new URL('../../runtime', import.meta.url)),
			}),
		).toThrow('must be outside the repository');
	} finally {
		process.chdir(previous);
	}
});
