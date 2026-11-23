import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	publishTypecheckBuildInfo,
	restoreTypecheckBuildInfo,
} from '../../tools/development/typecheckBuildInfoCache.ts';

const testRoot = resolve(
	process.cwd(),
	'node_modules/.cache/tests/typecheck-build-info-cache',
);

afterEach(() => {
	rmSync(testRoot, { force: true, recursive: true });
});

describe('typecheck build info cache', () => {
	test('新しいworktreeへ共有build infoを復元する', () => {
		const sharedPath = resolve(testRoot, 'shared/api.tsbuildinfo');
		const localPath = resolve(testRoot, 'local/api.tsbuildinfo');
		mkdirSync(resolve(testRoot, 'shared'), { recursive: true });
		writeFileSync(sharedPath, 'shared-build-info');

		const restored = restoreTypecheckBuildInfo({ localPath, sharedPath });

		expect(restored).toBe(true);
		expect(readFileSync(localPath, 'utf8')).toBe('shared-build-info');
	});

	test('worktree内の新しいbuild infoは共有cacheで上書きしない', () => {
		const sharedPath = resolve(testRoot, 'shared/api.tsbuildinfo');
		const localPath = resolve(testRoot, 'local/api.tsbuildinfo');
		mkdirSync(resolve(testRoot, 'shared'), { recursive: true });
		mkdirSync(resolve(testRoot, 'local'), { recursive: true });
		writeFileSync(sharedPath, 'older-shared-build-info');
		writeFileSync(localPath, 'current-worktree-build-info');

		const restored = restoreTypecheckBuildInfo({ localPath, sharedPath });

		expect(restored).toBe(false);
		expect(readFileSync(localPath, 'utf8')).toBe('current-worktree-build-info');
	});

	test('成功したbuild infoを原子的な置換用pathから共有する', () => {
		const sharedPath = resolve(testRoot, 'shared/package.tsbuildinfo');
		const localPath = resolve(testRoot, 'local/package.tsbuildinfo');
		mkdirSync(resolve(testRoot, 'shared'), { recursive: true });
		mkdirSync(resolve(testRoot, 'local'), { recursive: true });
		writeFileSync(sharedPath, 'previous-build-info');
		writeFileSync(localPath, 'validated-build-info');

		publishTypecheckBuildInfo({ localPath, sharedPath });

		expect(readFileSync(sharedPath, 'utf8')).toBe('validated-build-info');
	});
});
