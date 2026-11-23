import { describe, expect, test } from 'bun:test';
import {
	resolveSharedValidationCacheDirectory,
	withoutGitLocalEnvironment,
} from '../../tools/development/sharedGitCache.ts';

describe('shared Git cache', () => {
	test('nested submodule worktreeでも集約repositoryの共通Git領域を使う', () => {
		const aggregateRoot = '/repository/worktree';
		const apiRoot = `${aggregateRoot}/link-like-api-server`;
		const packageRoot = `${apiRoot}/local-tools`;
		const gitText = (
			repositoryRoot: string,
			arguments_: readonly string[],
		): string => {
			if (arguments_.includes('--show-superproject-working-tree')) {
				if (repositoryRoot === packageRoot) return apiRoot;
				if (repositoryRoot === apiRoot) return aggregateRoot;
				return '';
			}
			if (repositoryRoot === aggregateRoot) return '/repository/.git';
			throw new Error(`unexpected Git invocation: ${repositoryRoot}`);
		};

		expect(resolveSharedValidationCacheDirectory(packageRoot, gitText)).toBe(
			'/repository/.git/validation-cache/link-like-api-server--local-tools',
		);
	});

	test('hook由来のGit環境だけを親repositoryの検出から除外する', () => {
		expect(
			withoutGitLocalEnvironment(
				{
					GIT_DIR: '/worktree/package.git',
					GIT_INDEX_FILE: '/worktree/package.index',
					PATH: '/usr/bin',
				},
				['GIT_DIR', 'GIT_INDEX_FILE'],
			),
		).toEqual({ PATH: '/usr/bin' });
	});
});
