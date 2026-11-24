import { expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { initializeRuntime } from '../../src/runtime-initialization/initialize-runtime.ts';
import { externalFixturePath } from '../externalFixtures/sourcePath.ts';
import { createRuntimeInitializationFixture } from '../runtimeInitialization/fixtures/runtimeInitializationFixture.ts';

async function run(command: readonly string[], cwd: string): Promise<string> {
	const child = Bun.spawn([...command], {
		cwd,
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [status, output, error] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	if (status !== 0)
		throw new Error(`${command.join(' ')} failed: ${output}\n${error}`);
	return output;
}

test('通常AdminをソースからビルドしてHTTP起動し、ゲームと同じ状態を提供する', async () => {
	const temporary = await mkdtemp(join(tmpdir(), 'standalone-admin-'));
	const repository = resolve(import.meta.dir, '../..');
	try {
		const initializationRoot = join(temporary, 'runtime-initialization');
		await mkdir(initializationRoot);
		const initialization =
			await createRuntimeInitializationFixture(initializationRoot);
		await initializeRuntime(initialization.configuration);
		expect(
			z
				.object({ releaseId: z.string() })
				.parse(
					JSON.parse(
						await readFile(
							initialization.configuration.selectedReleasePath,
							'utf8',
						),
					),
				).releaseId,
		).toBe(initialization.pair.releaseId);
		await run(['bun', 'run', 'admin:build'], repository);
		const distributionRoot = join(repository, 'packages/admin-ui/dist');
		const artifacts = Array.from(
			new Bun.Glob('**/*').scanSync({ cwd: distributionRoot, onlyFiles: true }),
		);
		expect(artifacts.length).toBeGreaterThan(0);
		expect(artifacts.filter((path) => path.endsWith('.map'))).toEqual([]);
		const privateEnvironmentPatterns = [
			/\/home\/(?!web_user(?:\/|['"`]|$))[A-Za-z0-9._-]+(?:\/|['"`]|$)/u,
			/\/Users\/[^/\s]+\//u,
			/tail[0-9a-f]+\.ts\.net/iu,
			/\b100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/u,
		];
		for (const path of artifacts) {
			const bytes = await readFile(join(distributionRoot, path));
			const text = bytes.toString('utf8');
			const match = privateEnvironmentPatterns
				.map((pattern) => pattern.exec(text))
				.find((value) => value !== null);
			if (match !== undefined)
				throw new Error(
					`Private environment data in distributed artifact: ${path}: ${text.slice(Math.max(0, match.index - 30), match.index + 120)}`,
				);
		}

		const output = await run(
			[
				'bun',
				join(
					repository,
					'tests/serverComposition/fixtures/standaloneAdminApplication.ts',
				),
				externalFixturePath('runtime'),
			],
			repository,
		);
		const result = z
			.object({
				registrationStatus: z.number(),
				adminStatus: z.number(),
				pageStatus: z.number(),
				scriptStatus: z.number(),
				scriptContentType: z.string(),
				unknownStatus: z.number(),
				adminState: z.object({
					state: z.object({
						registeredUsers: z.array(z.object({ playerName: z.string() })),
					}),
				}),
			})
			.parse(JSON.parse(output));
		expect(result).toMatchObject({
			registrationStatus: 200,
			adminStatus: 200,
			pageStatus: 200,
			scriptStatus: 200,
			unknownStatus: 404,
		});
		expect(result.scriptContentType).toContain('javascript');

		expect(result.adminState.state.registeredUsers).toEqual([
			{ playerName: 'Sample User' },
		]);
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
}, 300_000);
