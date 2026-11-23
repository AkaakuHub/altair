import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { RuntimeResourceSelection } from 'altair/application/runtime-switch/runtime-resource-selection-schema';
import { CommandRuntimeSwitchJobLauncher } from '../../packages/admin-server/src/runtime/infrastructure/command-runtime-switch-job-launcher.ts';
import { parsePlatformManifest } from '../../src/master-archive/domain/platform-manifest.ts';
import { NodeMasterManifestStore } from '../../src/master-archive/infrastructure/node-master-manifest-store.ts';

const selection: RuntimeResourceSelection = {
	android: {
		source: 'resource',
		clientVersion: '5.1.0',
		resourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
	},
	ios: {
		source: 'resource',
		clientVersion: '6.0.0',
		resourceVersion: 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ==',
	},
};

test('異なるOS版を保存manifestで検証し、型付き選択をコマンドの独立した引数で渡す', async () => {
	const temporary = await mkdtemp(join(tmpdir(), 'runtime-switch-command-'));
	try {
		const archiveRoot = join(temporary, 'archive');
		const store = new NodeMasterManifestStore(archiveRoot);
		const manifests = (['android', 'ios'] as const).map((platform) =>
			parsePlatformManifest({
				schemaVersion: 1,
				platform,
				clientVersion: selection[platform].clientVersion,
				resourceVersion: selection[platform].resourceVersion,
				catalog: {
					identitySha256: 'a'.repeat(64),
					sourceSha256: 'b'.repeat(64),
				},
				tables: [],
			}),
		);
		for (const manifest of manifests) await store.writeVerified(manifest);
		const output = join(temporary, 'command result.json');
		const config = {
			activeMasterDatabasePath: join(archiveRoot, 'active.sqlite'),
			command: [
				process.execPath,
				resolve(import.meta.dir, 'fixtures/recordRuntimeSwitch.ts'),
				output,
				'sample argument with spaces',
			] as const,
		};
		const launcher = new CommandRuntimeSwitchJobLauncher(config);
		await launcher.launch(selection);
		expect(await Bun.file(output).json()).toEqual({
			marker: 'sample argument with spaces',
			mode: '--selection',
			selection,
		});
		await rm(output);
		await expect(
			launcher.launch({
				...selection,
				android: { ...selection.android, resourceVersion: 'R2606100@missing' },
			}),
		).rejects.toThrow('android saved master is unavailable or invalid');
		expect(await Bun.file(output).exists()).toBe(false);
		await expect(
			new CommandRuntimeSwitchJobLauncher({
				...config,
				command: [
					process.execPath,
					resolve(import.meta.dir, 'fixtures/recordRuntimeSwitch.ts'),
					output,
					'fail',
				],
			}).launch(selection),
		).rejects.toThrow('runtime switch job could not be started');
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
});
