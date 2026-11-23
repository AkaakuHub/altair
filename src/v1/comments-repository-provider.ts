import { CommentsRepository } from './comments-read-repository.ts';

export type CommentsRepositoryProvider = () => CommentsRepository;

export function createCommentsRepositoryProvider(
	dbPath: string,
): CommentsRepositoryProvider {
	let repository: CommentsRepository | undefined;
	return () => (repository ??= new CommentsRepository(dbPath));
}
