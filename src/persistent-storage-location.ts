import { isAbsolute, relative, resolve, sep } from 'node:path';

type PersistentStoragePath = Readonly<{
	name: string;
	path: string;
}>;

export function assertPersistentStorageOutsideRepository(
	repositoryRoot: string,
	paths: readonly PersistentStoragePath[],
): void {
	const resolvedRepositoryRoot = resolve(repositoryRoot);
	for (const candidate of paths) {
		const relativePath = relative(
			resolvedRepositoryRoot,
			resolve(candidate.path),
		);
		if (
			relativePath === '' ||
			(!isAbsolute(relativePath) &&
				relativePath !== '..' &&
				!relativePath.startsWith(`..${sep}`))
		) {
			throw new Error(
				`${candidate.name} must be outside the repository: ${candidate.path}`,
			);
		}
	}
}
