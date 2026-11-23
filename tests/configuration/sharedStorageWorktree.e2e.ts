import { expect, test } from 'bun:test';
import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('別worktreeからも同じ外部入力と永続DBを参照する', async () => {
	const repository = resolve(import.meta.dir, '../..');
	const temporary = await mkdtemp(join(tmpdir(), 'shared-worktree-'));
	const checkout = join(temporary, 'checkout');
	const storage = join(temporary, 'storage');
	const registry = join(storage, 'inputs/resource-version-registry');
	let created = false;
	try {
		await mkdir(registry, { recursive: true });
		await writeFile(join(registry, 'client-res.json'), '{"fixture":[]}');
		await run(
			[
				'git',
				'-C',
				repository,
				'worktree',
				'add',
				'--detach',
				checkout,
				'HEAD',
			],
			repository,
		);
		created = true;
		await symlink(
			join(repository, 'node_modules'),
			join(checkout, 'node_modules'),
		);
		const script = `import {loadConfig} from './src/config.ts';
const c = loadConfig(process.env);
console.log(JSON.stringify({root:c.root, registry:c.resourceVersionRegistryRoot, state:c.stateDbPath, master:c.activeMasterDatabasePath, selected:c.selectedMasterReleasePath}));`;
		const environment = {
			...process.env,
			HOST: 'localhost',
			PORT: '8080',
			DATA_ROOT: storage,
		};
		const main = await run(['bun', '-e', script], repository, environment);
		const other = await run(['bun', '-e', script], checkout, environment);
		expect(JSON.parse(other)).toEqual(JSON.parse(main));
		const config = JSON.parse(other) as {
			registry: string;
			state: string;
			master: string;
		};
		expect(
			await readFile(join(config.registry, 'client-res.json'), 'utf8'),
		).toBe('{"fixture":[]}');
		expect(config.state).toBe(join(storage, 'state.sqlite'));
		expect(config.master).toBe(join(storage, 'master-archive/active.sqlite'));
	} finally {
		if (created) {
			await rm(join(checkout, 'node_modules'), { force: true });
			await run(
				['git', '-C', repository, 'worktree', 'remove', checkout],
				repository,
			);
		}
		await rm(temporary, { recursive: true, force: true });
	}
}, 60_000);

async function run(
	command: string[],
	cwd: string,
	env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
	const child = Bun.spawn(command, {
		cwd,
		env,
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [status, output, error] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	if (status !== 0) throw new Error(`${command[0]} failed: ${error}`);
	return output;
}
