import { describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CommandCandidateDatabase } from '../src/application/runtime-switch/runtime-switch-node-ports.ts';
import { parseCandidateBuildArgument } from '../src/master-archive/infrastructure/candidate-build-arguments.ts';

describe('CommandCandidateDatabase', () => {
	test('active DB交換をrollbackまたはcommitできる', async () => {
		const root = await mkdtemp(join(tmpdir(), 'runtime-candidate-exchange-'));
		const activePath = join(root, 'active.sqlite');
		const candidatePath = join(root, 'candidate.sqlite');
		try {
			await writeFile(activePath, 'old');
			await writeFile(candidatePath, 'new');
			const database = new CommandCandidateDatabase(['unused']);
			const exchange = await database.exchange(candidatePath, activePath);

			expect(await Bun.file(activePath).text()).toBe('new');
			await database.rollback(exchange, activePath);
			expect(await Bun.file(activePath).text()).toBe('old');

			await writeFile(candidatePath, 'newer');
			const committed = await database.exchange(candidatePath, activePath);
			await database.commit(committed);
			expect(await Bun.file(activePath).text()).toBe('newer');
			expect(await Bun.file(committed.previousPath).exists()).toBe(false);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test('build command失敗時に途中生成されたSQLite filesを削除する', async () => {
		const root = await mkdtemp(join(tmpdir(), 'runtime-candidate-'));
		const generatedPaths: string[] = [];
		try {
			const androidManifest = manifest('android', 'R2606002@android');
			const iosManifest = manifest('ios', 'R2606002@ios');
			const database = new CommandCandidateDatabase(
				['build-candidate'],
				async (command) => {
					const { candidatePath } = parseCandidateBuildArgument(
						required(command.at(-1)),
					);
					generatedPaths.push(
						candidatePath,
						`${candidatePath}-shm`,
						`${candidatePath}-wal`,
					);
					await Promise.all(
						generatedPaths.map((path) => writeFile(path, 'partial')),
					);
					throw new Error('build failed');
				},
			);

			await expect(
				database.build({
					releaseId: 'a'.repeat(64),
					kind: 'official',
					environment: {},
					androidManifest,
					iosManifest,
					androidManifestPath: '/archive/android.json',
					iosManifestPath: '/archive/ios.json',
					activeDatabasePath: join(root, 'active.sqlite'),
				}),
			).rejects.toThrow('build failed');

			for (const path of generatedPaths) {
				expect(await Bun.file(path).exists()).toBe(false);
			}
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});

function required(value: string | undefined): string {
	if (value === undefined) throw new Error('candidate path is absent');
	return value;
}

function manifest(platform: 'android' | 'ios', resourceVersion: string) {
	return {
		schemaVersion: 1 as const,
		platform,
		clientVersion: '5.1.0',
		resourceVersion,
		catalog: {
			identitySha256: platform === 'android' ? 'a'.repeat(64) : 'b'.repeat(64),
			sourceSha256: platform === 'android' ? 'c'.repeat(64) : 'd'.repeat(64),
		},
		tables: [],
	};
}
