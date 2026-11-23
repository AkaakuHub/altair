import { relative, resolve, sep } from 'node:path';

type GitText = (
	repositoryRoot: string,
	arguments_: readonly string[],
) => string;

export function resolveSharedValidationCacheDirectory(
	repositoryRoot: string,
	providedGitText?: GitText,
): string {
	const gitText =
		providedGitText ?? createCrossRepositoryGitText(repositoryRoot);
	const outermostRepositoryRoot = findOutermostRepositoryRoot(
		repositoryRoot,
		gitText,
	);
	const commonGitDirectory = resolve(
		outermostRepositoryRoot,
		gitText(outermostRepositoryRoot, ['rev-parse', '--git-common-dir']),
	);
	const repositoryPath = relative(outermostRepositoryRoot, repositoryRoot);
	const repositoryNamespace =
		repositoryPath === '' ? 'root' : repositoryPath.split(sep).join('--');
	return resolve(commonGitDirectory, 'validation-cache', repositoryNamespace);
}

export function withoutGitLocalEnvironment(
	environment: Readonly<Record<string, string | undefined>>,
	localVariableNames: readonly string[],
): Record<string, string | undefined> {
	const sanitizedEnvironment = { ...environment };
	for (const variableName of localVariableNames) {
		delete sanitizedEnvironment[variableName];
	}
	return sanitizedEnvironment;
}

function findOutermostRepositoryRoot(
	repositoryRoot: string,
	gitText: GitText,
): string {
	let currentRepositoryRoot = repositoryRoot;
	while (true) {
		const superprojectRoot = gitText(currentRepositoryRoot, [
			'rev-parse',
			'--show-superproject-working-tree',
		]);
		if (superprojectRoot === '') return currentRepositoryRoot;
		currentRepositoryRoot = superprojectRoot;
	}
}

function createCrossRepositoryGitText(repositoryRoot: string): GitText {
	const localVariables = Bun.spawnSync(
		['git', 'rev-parse', '--local-env-vars'],
		{
			cwd: repositoryRoot,
			stdout: 'pipe',
			stderr: 'inherit',
		},
	);
	if (localVariables.exitCode !== 0) {
		throw new Error(
			`git rev-parse --local-env-vars failed: ${localVariables.exitCode}`,
		);
	}
	const environment = withoutGitLocalEnvironment(
		process.env,
		localVariables.stdout.toString().trim().split('\n'),
	);
	return (targetRepositoryRoot, arguments_) => {
		const result = Bun.spawnSync(
			['git', '-C', targetRepositoryRoot, ...arguments_],
			{
				env: environment,
				stdout: 'pipe',
				stderr: 'inherit',
			},
		);
		if (result.exitCode !== 0) {
			throw new Error(`git ${arguments_.join(' ')} failed: ${result.exitCode}`);
		}
		return result.stdout.toString().trim();
	};
}
