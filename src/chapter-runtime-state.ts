import type { ChapterAdminSummaryMaster } from './master-data/chapter-admin-master-data.ts';
import type { ChapterRuntimeState } from './server-state-schema.ts';

export function createDefaultChapterRuntimeState(
	defaults: ChapterAdminSummaryMaster,
): ChapterRuntimeState {
	return {
		activeChapterId: defaults.chapterId,
		startDate: defaults.startDate,
		endDate: defaults.endDate,
	};
}
