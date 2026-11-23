import type { UserChapterState } from '../../../../../../src/state/chapter-types.ts';

export function replaceMigrationPlayerChapter(
	chapters: readonly UserChapterState[],
	chapter: UserChapterState,
): UserChapterState[] {
	return [
		...chapters.filter(
			(current) =>
				current.playerId !== chapter.playerId ||
				current.chapterId !== chapter.chapterId ||
				current.identityFingerprint !== undefined,
		),
		chapter,
	];
}
