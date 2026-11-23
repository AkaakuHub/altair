import { Database } from 'bun:sqlite';
import { expect, test } from 'bun:test';
import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { runtimeMaintenanceStateSchema } from '../../src/application/runtime-switch/runtime-maintenance-state.ts';
import { openSqliteActiveMasterRepository } from '../../src/master-data/sqlite-active-master-repository.ts';
import { initializeRuntime } from '../../src/runtime-initialization/initialize-runtime.ts';
import { createRuntimeInitializationFixture } from './fixtures/runtimeInitializationFixture.ts';

async function fixture() {
	return createRuntimeInitializationFixture(
		await mkdtemp(join(tmpdir(), 'runtime-initialization-')),
	);
}

test('初期化はDBを変更せず、通常の読込で使えるrelease情報とメンテナンス設定を作る', async () => {
	const input = await fixture();
	try {
		const before = await readFile(input.configuration.activeDatabasePath);
		const result = await initializeRuntime(input.configuration);
		expect(result.selection.releaseId).toBe(input.pair.releaseId);
		const repository = openSqliteActiveMasterRepository(
			input.configuration.activeDatabasePath,
			input.configuration.selectedReleasePath,
		);
		try {
			expect(repository.selection.databaseFingerprint).toBe('c'.repeat(64));
		} finally {
			repository.close();
		}
		expect(
			runtimeMaintenanceStateSchema.parse(
				JSON.parse(await readFile(input.maintenancePath, 'utf8')),
			),
		).toEqual({
			schemaVersion: 1,
			enabled: false,
			androidResourceVersion: input.pair.android.resourceVersion,
			iosResourceVersion: input.pair.ios.resourceVersion,
		});
		expect(await readFile(input.configuration.activeDatabasePath)).toEqual(
			before,
		);
		expect(
			(await stat(input.configuration.selectedReleasePath)).mode & 0o777,
		).toBe(0o600);
		expect((await stat(input.maintenancePath)).mode & 0o777).toBe(0o600);
	} finally {
		await rm(input.root, { recursive: true, force: true });
	}
});

for (const target of ['selection', 'maintenance'] as const) {
	test(`既存の${target}を上書きせず、もう一方の設定も作らない`, async () => {
		const input = await fixture();
		try {
			const path =
				target === 'selection'
					? input.configuration.selectedReleasePath
					: input.maintenancePath;
			const other =
				target === 'selection'
					? input.maintenancePath
					: input.configuration.selectedReleasePath;
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, 'existing');
			await expect(initializeRuntime(input.configuration)).rejects.toThrow(
				'already exists',
			);
			expect(await readFile(path, 'utf8')).toBe('existing');
			expect(await Bun.file(other).exists()).toBe(false);
		} finally {
			await rm(input.root, { recursive: true, force: true });
		}
	});
}

test('DBとマニフェストが不一致なら設定を作らない', async () => {
	const input = await fixture();
	try {
		const database = new Database(input.configuration.activeDatabasePath);
		try {
			database
				.query(
					"UPDATE active_database_metadata SET value = ? WHERE key = 'release_identity'",
				)
				.run('d'.repeat(64));
		} finally {
			database.close();
		}
		await expect(initializeRuntime(input.configuration)).rejects.toThrow(
			'release identity differs',
		);
		expect(
			await Bun.file(input.configuration.selectedReleasePath).exists(),
		).toBe(false);
		expect(await Bun.file(input.maintenancePath).exists()).toBe(false);
	} finally {
		await rm(input.root, { recursive: true, force: true });
	}
});

test('出力先同士が重なる設定はファイルを作る前に拒否する', async () => {
	const input = await fixture();
	try {
		await expect(
			initializeRuntime({
				...input.configuration,
				selectedReleasePath: join(input.maintenancePath, 'selection.json'),
			}),
		).rejects.toThrow('must not contain one another');
		expect(await Bun.file(input.maintenancePath).exists()).toBe(false);
	} finally {
		await rm(input.root, { recursive: true, force: true });
	}
});
