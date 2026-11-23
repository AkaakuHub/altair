export type PrePushCheck =
	| 'master-query-manifest'
	| 'api-contracts'
	| 'typecheck'
	| 'knip';

const allChecks: readonly PrePushCheck[] = [
	'master-query-manifest',
	'api-contracts',
	'typecheck',
	'knip',
];

export function selectPrePushChecks(
	paths: readonly string[],
): readonly PrePushCheck[] {
	if (
		paths.some(
			(path) =>
				path === '.githooks/pre-commit' ||
				path === '.githooks/pre-push' ||
				path === 'src/cli/select-pre-push-checks.ts' ||
				path === 'scripts/install-git-hooks.sh',
		)
	)
		return allChecks;
	const checks = new Set<PrePushCheck>();
	if (
		paths.some((path) =>
			/^packages\/(?:runtime|admin-ui|admin-server)\//u.test(path),
		)
	)
		checks.add('typecheck');
	for (const path of paths) {
		const packageChanged = path === 'package.json' || path === 'bun.lock';
		const workspaceChanged =
			/^packages\/(?:runtime|admin-ui|admin-server)\/(?:.*\.tsx?|package\.json)$/u.test(
				path,
			);
		if (
			packageChanged ||
			/^src\/.*\.tsx?$/u.test(path) ||
			path.startsWith('tools/apiDocumentation/') ||
			path === 'src/apiDocumentation/generated/contracts.json'
		)
			checks.add('api-contracts');
		const sourceChanged = /^(?:src|tests|tools)\/.*\.tsx?$/u.test(path);
		if (packageChanged || sourceChanged || path === 'tsconfig.json')
			checks.add('typecheck');
		if (
			packageChanged ||
			/^src\/.*\.tsx?$/u.test(path) ||
			path ===
				'src/master-archive/infrastructure/generated-active-master-query-manifest.json' ||
			path === 'src/master-archive/infrastructure/master-table-schemas.json' ||
			/^packages\/admin-server\/src\/.*\.tsx?$/u.test(path)
		)
			checks.add('master-query-manifest');
		if (
			packageChanged ||
			workspaceChanged ||
			sourceChanged ||
			path === 'knip.json'
		)
			checks.add('knip');
	}
	return allChecks.filter((check) => checks.has(check));
}

if (import.meta.main) {
	for (const check of selectPrePushChecks(process.argv.slice(2)))
		console.log(check);
}
