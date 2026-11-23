import { resolve } from 'node:path';
import { selectTestsWithFixtures } from './selectTestsWithFixtures.ts';

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

const files =
	mode === 'unit' || mode === 'staged'
		? await selectTestsWithFixtures(paths, root)
		: paths;
if (files.length > 0) {
	const child = Bun.spawn(
		[
			'bun',
			'test',
			...(mode === 'staged' ? ['--bail'] : []),
			...files.map((path) => resolve(root, path)),
		],
		{ cwd: root, stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' },
	);
	process.exit(await child.exited);
}
