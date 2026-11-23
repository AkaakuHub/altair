import { expect, test } from 'bun:test';
import { resolve } from 'node:path';
import provenance from '../fixtures/master-binary/provenance.json';

test('リポジトリのローカル設定と生データをGitから除外する', () => {
	const cwd = resolve(import.meta.dir, '../..');
	const paths = [
		'.env',
		'.env.production',
		'settings/operator.local.json',
		'resources/master.res',
		'resources/source.yaml',
		'resources/source.yml',
		...provenance.officialFixtures.map(
			({ fixture }) => `tests/fixtures/master-binary/${fixture}`,
		),
		'tests/fixtures/master-binary/carddatas-r2604100.encrypted',
	];
	const result = Bun.spawnSync(
		['git', 'check-ignore', '--no-index', ...paths, '.env.example'],
		{
			cwd,
			stdout: 'pipe',
			stderr: 'pipe',
		},
	);
	if (result.exitCode !== 0) throw new Error(result.stderr.toString());
	expect(result.stdout.toString().trim().split('\n').sort()).toEqual(
		paths.sort(),
	);
});
