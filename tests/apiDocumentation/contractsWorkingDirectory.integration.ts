import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('API外の作業ディレクトリでも同じ契約を再生成する', async () => {
	const directory = await mkdtemp(
		join(tmpdir(), 'api-contract-working-directory-'),
	);
	try {
		const process = Bun.spawn(
			[
				'bun',
				fileURLToPath(
					new URL(
						'../../src/cli/generate-game-api-contracts.ts',
						import.meta.url,
					),
				),
				'--check',
			],
			{ cwd: directory, stdout: 'pipe', stderr: 'pipe' },
		);
		const [status, output, error] = await Promise.all([
			process.exited,
			new Response(process.stdout).text(),
			new Response(process.stderr).text(),
		]);
		if (status !== 0)
			throw new Error(`Contract generation failed: ${output}\n${error}`);
		expect(status).toBe(0);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}, 60_000);
