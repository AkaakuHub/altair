import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '../..');
const [mode, ...requested] = process.argv.slice(2);
if (
	mode !== 'unit' &&
	mode !== 'staged' &&
	mode !== 'integration' &&
	mode !== 'e2e'
)
	throw new Error('Expected unit, staged, integration or e2e test mode');

const paths =
	mode === 'staged'
		? requested
		: Array.from(
				new Bun.Glob(
					`tests/**/*.${mode === 'unit' ? 'test' : mode}.ts`,
				).scanSync({ cwd: root }),
			).sort();

if (paths.length > 0) {
	const child = Bun.spawn(
		[
			'bun',
			'test',
			...(mode === 'staged' ? ['--bail'] : []),
			...paths.map((path) => resolve(root, path)),
		],
		{ cwd: root, stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' },
	);
	process.exit(await child.exited);
}
