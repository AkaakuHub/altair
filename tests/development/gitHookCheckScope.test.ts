import { describe, expect, test } from 'bun:test';
import { selectPrePushChecks } from '../../src/cli/select-pre-push-checks.ts';

describe('pre-push check scope', () => {
	test('workspaceのコードと依存定義は型と未使用コードを検査する', () => {
		for (const path of [
			'packages/runtime/src/domain/example.ts',
			'packages/runtime/src/ui/example.tsx',
			'packages/runtime/package.json',
			'packages/admin-ui/src/ui/example.tsx',
			'packages/admin-ui/package.json',
			'packages/admin-server/package.json',
		]) {
			expect(selectPrePushChecks([path])).toEqual(['typecheck', 'knip']);
		}
		expect(selectPrePushChecks(['packages/runtime/tsconfig.json'])).toEqual([
			'typecheck',
		]);
	});
	test('Adminのクエリと生成済みのマニフェストを検査する', () => {
		expect(
			selectPrePushChecks(['packages/admin-server/src/routes/example.ts']),
		).toEqual(['master-query-manifest', 'typecheck', 'knip']);
		for (const file of [
			'generated-active-master-query-manifest.json',
			'master-table-schemas.json',
		]) {
			expect(
				selectPrePushChecks([`src/master-archive/infrastructure/${file}`]),
			).toEqual(['master-query-manifest']);
		}
	});
	test('API source変更は本体APIの契約を検査する', () => {
		expect(selectPrePushChecks(['src/v1/example.ts'])).toEqual([
			'master-query-manifest',
			'api-contracts',
			'typecheck',
			'knip',
		]);
	});
	test('共通開発ツールの変更は型と未使用コードを検査する', () => {
		expect(selectPrePushChecks(['tools/development/runTypecheck.ts'])).toEqual([
			'typecheck',
			'knip',
		]);
	});
	test('文書生成ツールと生成物はAPI契約の一致を検査する', () => {
		expect(
			selectPrePushChecks(['tools/apiDocumentation/generateTypedContracts.ts']),
		).toEqual(['api-contracts', 'typecheck', 'knip']);
		expect(
			selectPrePushChecks(['src/apiDocumentation/generated/contracts.json']),
		).toEqual(['api-contracts']);
	});
	test('文書だけの変更ではコード検査を実行しない', () => {
		expect(selectPrePushChecks(['local-tools', 'README.md'])).toEqual([]);
	});
	test('hook契約変更では本体APIの全検査を実行する', () => {
		for (const path of ['.githooks/pre-commit', '.githooks/pre-push']) {
			expect(selectPrePushChecks([path])).toEqual([
				'master-query-manifest',
				'api-contracts',
				'typecheck',
				'knip',
			]);
		}
	});
});
