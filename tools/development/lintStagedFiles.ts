import { basename } from 'node:path';

const result = Bun.spawnSync(
	[
		'git',
		'diff',
		'--cached',
		'--relative',
		'--name-only',
		'--diff-filter=ACMR',
		'-z',
	],
	{
		stdout: 'pipe',
		stderr: 'inherit',
	},
);
if (result.exitCode !== 0) process.exit(result.exitCode);
const files = result.stdout
	.toString()
	.split('\0')
	.filter((file) => {
		const name = basename(file);
		return (
			/\.tsx?$/u.test(name) ||
			['package.json', 'biome.json', 'knip.json'].includes(name) ||
			/^tsconfig.*\.json$/u.test(name)
		);
	});
const unstaged = Bun.spawnSync(
	['git', 'diff', '--relative', '--name-only', '-z'],
	{ stdout: 'pipe', stderr: 'inherit' },
);
if (unstaged.exitCode !== 0) process.exit(unstaged.exitCode);
const unstagedPaths = new Set(unstaged.stdout.toString().split('\0'));
const formats = files.filter((path) => !unstagedPaths.has(path));

if (formats.length !== files.length) {
	const prefix = Bun.spawnSync(['git', 'rev-parse', '--show-prefix'], {
		stdout: 'pipe',
		stderr: 'inherit',
	});
	if (prefix.exitCode !== 0) process.exit(prefix.exitCode);
	const projectPrefix = prefix.stdout.toString().trimEnd();
	for (const file of files) {
		if (!unstagedPaths.has(file)) continue;
		const staged = Bun.spawnSync(['git', 'show', `:${projectPrefix}${file}`], {
			stdout: 'pipe',
			stderr: 'inherit',
		});
		if (staged.exitCode !== 0) process.exit(staged.exitCode);
		const lint = Bun.spawnSync(
			[
				'bun',
				'run',
				'--silent',
				'biome',
				'check',
				'--write',
				`--stdin-file-path=${file}`,
			],
			{ stdin: staged.stdout, stdout: 'pipe', stderr: 'inherit' },
		);
		if (lint.exitCode !== 0) process.exit(lint.exitCode);
		if (!lint.stdout.equals(staged.stdout)) {
			console.error(`Staged content requires formatting: ${file}`);
			process.exit(1);
		}
	}
}
for (let offset = 0; offset < formats.length; offset += 100) {
	const batch = formats.slice(offset, offset + 100);
	const lint = Bun.spawnSync(
		['bun', 'x', '--no-install', 'biome', 'check', '--write', '--', ...batch],
		{
			stdin: 'inherit',
			stdout: 'inherit',
			stderr: 'inherit',
		},
	);
	if (lint.exitCode !== 0) process.exit(lint.exitCode);
	const stage = Bun.spawnSync(['git', 'add', '--', ...batch], {
		stdout: 'inherit',
		stderr: 'inherit',
	});
	if (stage.exitCode !== 0) process.exit(stage.exitCode);
}
