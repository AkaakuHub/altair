import { dirname, resolve, sep } from 'node:path';

const fixtureSource = resolve(
	import.meta.dir,
	'../../tests/externalFixtures/sourcePath.ts',
);
const ts = new Bun.Transpiler({ loader: 'ts' });
const tsx = new Bun.Transpiler({ loader: 'tsx' });

export async function selectTestsWithFixtures(
	paths: readonly string[],
	projectRoot: string,
): Promise<string[]> {
	if (process.env.ALTAIR_TEST_DATA_ROOT !== undefined) return [...paths];
	const imports = new Map<string, readonly string[]>();
	const selected: string[] = [];
	for (const path of paths) {
		const pending = [resolve(projectRoot, path)];
		const visited = new Set<string>();
		let needsFixtures = false;
		while (pending.length !== 0) {
			const source = pending.pop();
			if (source === undefined || visited.has(source)) continue;
			if (source === fixtureSource) {
				needsFixtures = true;
				break;
			}
			visited.add(source);
			let dependencies = imports.get(source);
			if (dependencies === undefined) {
				dependencies = await resolveLocalImports(source);
				imports.set(source, dependencies);
			}
			pending.push(...dependencies);
		}
		if (needsFixtures)
			console.info(`SKIP ${path}: ALTAIR_TEST_DATA_ROOT is unset`);
		else selected.push(path);
	}
	return selected;
}

async function resolveLocalImports(source: string): Promise<string[]> {
	const file = Bun.file(source);
	if (!(await file.exists())) return [];
	const scanner = source.endsWith('x') ? tsx : ts;
	return scanner.scanImports(await file.text()).flatMap(({ path }) => {
		try {
			const dependency = Bun.resolveSync(path, dirname(source));
			if (
				dependency.split(sep).includes('node_modules') ||
				!/[.]([cm]?[jt]s|[jt]sx)$/u.test(dependency)
			)
				return [];
			return [dependency];
		} catch {
			return [];
		}
	});
}
