import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { resolveSharedValidationCacheDirectory } from './sharedGitCache.ts';
import {
	canReuseValidation,
	createValidationIdentity,
	createValidationMarkerPath,
} from './validationCache.ts';

export type ValidationMode = 'staged' | 'push';

export async function runCachedValidation(input: {
	mode: ValidationMode;
	validationKey: string;
	command: readonly string[];
}): Promise<number> {
	if (input.command.length === 0)
		throw new Error('validation command is absent');
	const repositoryRoot = gitText(['rev-parse', '--show-toplevel']);
	const tree = gitText(
		input.mode === 'staged' ? ['write-tree'] : ['rev-parse', 'HEAD^{tree}'],
	);
	const identity = createValidationIdentity({
		tree,
		bunVersion: Bun.version,
		validationKey: input.validationKey,
		command: input.command,
	});
	const markerPath = createValidationMarkerPath({
		cacheDirectory: resolve(
			resolveSharedValidationCacheDirectory(repositoryRoot),
			relative(repositoryRoot, process.cwd()),
		),
		validationKey: input.validationKey,
		identity,
	});
	const worktreeClean = isWorktreeClean(input.mode);

	if (
		canReuseValidation({
			markerExists: existsSync(markerPath),
			worktreeClean,
		})
	) {
		console.error(`==> ${input.validationKey} skip（同一treeを検証済み）`);
		return 0;
	}

	const validation = Bun.spawn([...input.command], {
		cwd: process.cwd(),
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
	});
	const status = await validation.exited;
	if (status !== 0) return status;

	if (worktreeClean) {
		mkdirSync(dirname(markerPath), { recursive: true });
		writeFileSync(markerPath, `${identity}\n`);
	}
	return 0;
}

export function parseValidationMode(value: string | undefined): ValidationMode {
	if (value === 'staged' || value === 'push') return value;
	throw new Error('validation mode must be staged or push');
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

function isWorktreeClean(validationMode: ValidationMode): boolean {
	if (validationMode === 'push') {
		return gitText(['status', '--porcelain', '--untracked-files=all']) === '';
	}
	const unstaged = Bun.spawnSync(['git', 'diff', '--quiet'], {
		cwd: process.cwd(),
		stdout: 'ignore',
		stderr: 'inherit',
	});
	if (unstaged.exitCode !== 0) return false;
	return gitText(['ls-files', '--others', '--exclude-standard']) === '';
}

if (import.meta.main) {
	const [modeSource, validationKey, separator, ...command] =
		process.argv.slice(2);
	if (separator !== '--' || validationKey === undefined) {
		throw new Error(
			'usage: runCachedValidation.ts <staged|push> <validation-key> -- <command>',
		);
	}
	process.exit(
		await runCachedValidation({
			mode: parseValidationMode(modeSource),
			validationKey,
			command,
		}),
	);
}
