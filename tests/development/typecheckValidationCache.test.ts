import { describe, expect, test } from 'bun:test';
import {
	canReuseValidation,
	createValidationIdentity,
	createValidationMarkerPath,
} from '../../tools/development/validationCache.ts';

describe('typecheck validation cache', () => {
	test('同一treeと実行環境の成功結果だけを再利用する', () => {
		const identity = createValidationIdentity({
			tree: 'tree-a',
			bunVersion: '1.3.0',
			validationKey: 'typecheck',
			command: ['bun', 'run', 'typecheck'],
		});

		expect(
			canReuseValidation({
				markerExists: true,
				worktreeClean: true,
			}),
		).toBe(true);
		expect(
			createValidationMarkerPath({
				cacheDirectory: '/repository/.git/validation-cache/package',
				validationKey: 'typecheck',
				identity,
			}),
		).toMatch(
			/^\/repository\/\.git\/validation-cache\/package\/typecheck\/[0-9a-f]{64}$/u,
		);
	});

	test('tree、検査、commandを区別する', () => {
		const identity = createValidationIdentity({
			tree: 'tree-a',
			bunVersion: '1.3.0',
			validationKey: 'typecheck',
			command: ['bun', 'run', 'typecheck'],
		});
		const otherTree = createValidationIdentity({
			tree: 'tree-b',
			bunVersion: '1.3.0',
			validationKey: 'typecheck',
			command: ['bun', 'run', 'typecheck'],
		});
		const otherCommand = createValidationIdentity({
			tree: 'tree-a',
			bunVersion: '1.3.0',
			validationKey: 'knip',
			command: ['bun', 'run', 'knip'],
		});

		expect(otherTree).not.toBe(identity);
		expect(otherCommand).not.toBe(identity);
	});

	test('markerがない場合とworktreeがcleanでない場合は再検査する', () => {
		expect(
			canReuseValidation({
				markerExists: false,
				worktreeClean: true,
			}),
		).toBe(false);
		expect(
			canReuseValidation({
				markerExists: true,
				worktreeClean: false,
			}),
		).toBe(false);
	});
});
