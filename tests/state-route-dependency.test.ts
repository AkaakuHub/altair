import { describe, expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';

describe('state route dependency', () => {
	test('registered user lookupを共通境界から行う', async () => {
		const routeFiles = (
			await readdir('src/v1/state-routes', { recursive: true })
		)
			.filter((path) => path.endsWith('.ts'))
			.map((path) => `src/v1/state-routes/${path}`);
		for (const path of routeFiles) {
			const source = await Bun.file(path).text();
			expect(source).not.toContain('registeredUsers.find(');
		}
	});

	test('認証済みユーザーのmaster解決にユーザー情報を渡す', async () => {
		const routeFiles = (
			await readdir('src/v1/state-routes', { recursive: true })
		)
			.filter((path) => path.endsWith('.ts'))
			.map((path) => `src/v1/state-routes/${path}`);
		for (const path of routeFiles) {
			const source = await Bun.file(path).text();
			expect(source).not.toContain('resolveMasterDatabase(c),');
			expect(source).not.toContain('resolveUserStatus(c);');
		}
	});

	test('mission進捗の更新をcontroller経由に限定する', async () => {
		const routeFiles = (
			await Promise.all(
				['src/v1/state-routes', 'src/v1/route-support'].map(async (directory) =>
					(
						await readdir(directory, { recursive: true })
					)
						.filter((path) => path.endsWith('.ts'))
						.map((path) => `${directory}/${path}`),
				),
			)
		).flat();
		const directMutationNames = [
			'incrementMissionProgressByTransition',
			'incrementBeginnerMissionProgressByTransition',
			'setSchoolStageStarMissionProgress',
			'setRhythmGameStarMissionProgress',
		];
		for (const path of routeFiles) {
			const source = await Bun.file(path).text();
			expect(source).not.toContain('resolveMissionProgress(c).');
			for (const mutationName of directMutationNames) {
				expect(source).not.toContain(mutationName);
			}
		}
	});
});
