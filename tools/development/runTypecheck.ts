import { basename, dirname, resolve } from 'node:path';
import { z } from 'zod';
import { resolveSharedValidationCacheDirectory } from './sharedGitCache.ts';
import {
	publishTypecheckBuildInfo,
	restoreTypecheckBuildInfo,
} from './typecheckBuildInfoCache.ts';

export async function runTypecheck(project: string = '.'): Promise<number> {
	const repositoryRoot = gitText(['rev-parse', '--show-toplevel']);
	const projectRoot = resolve(process.cwd(), project);
	const config = z
		.object({
			compilerOptions: z.object({ tsBuildInfoFile: z.string().min(1) }),
		})
		.parse(await Bun.file(resolve(projectRoot, 'tsconfig.json')).json());
	const localPath = resolve(
		projectRoot,
		config.compilerOptions.tsBuildInfoFile,
	);
	const buildInfoFileName = basename(localPath);
	const sharedPath = resolve(
		resolveSharedValidationCacheDirectory(repositoryRoot),
		'typescript',
		buildInfoFileName,
	);
	const cacheRestored = restoreTypecheckBuildInfo({ localPath, sharedPath });
	console.error(
		`==> typecheck incremental cache: ${cacheRestored ? 'restored' : 'local/cold'}`,
	);

	const typecheck = Bun.spawn(
		[
			resolve(
				dirname(Bun.resolveSync('typescript/package.json', projectRoot)),
				'bin/tsc',
			),
			'--noEmit',
			'--checkers',
			'1',
		],
		{
			cwd: projectRoot,
			stdin: 'inherit',
			stdout: 'inherit',
			stderr: 'inherit',
		},
	);
	const status = await typecheck.exited;
	if (status === 0) {
		publishTypecheckBuildInfo({ localPath, sharedPath });
		console.error('==> typecheck incremental cache: updated');
	}
	return status;
}

function gitText(arguments_: readonly string[]): string {
	const result = Bun.spawnSync(['git', ...arguments_], {
		cwd: process.cwd(),
		stdout: 'pipe',
		stderr: 'inherit',
	});
	if (result.exitCode !== 0) {
		throw new Error(`git ${arguments_.join(' ')} failed: ${result.exitCode}`);
	}
	return result.stdout.toString().trim();
}

if (import.meta.main) {
	process.exit(await runTypecheck(process.argv[2]));
}
