import type { Database } from 'bun:sqlite';
import { getLatestChapterRuntimeDefaultsFromDatabase } from './master-data/chapter-admin-master-data.ts';
import { getLatestGradeChallengeMasterRuntimeDefaultsFromDatabase } from './master-data/grade-challenge-runtime-defaults.ts';
import { getCurrentGradeLiveMasterRuntimeDefaultsFromDatabase } from './master-data/grade-live-runtime-defaults.ts';
import { getGrandPrixAdminSummaryFromDatabase } from './master-data/grand-prix-admin-master-data.ts';
import { getGrandPrixMasterRuntimeDefaultsFromDatabase } from './master-data/grand-prix-runtime-defaults.ts';
import type {
	ChapterRuntimeState,
	GradeChallengeRuntimeState,
	GradeLiveRuntimeState,
	GrandPrixRuntimeState,
} from './server-state-schema.ts';

export type ServerRuntimeDefaults = Readonly<{
	chapter: ChapterRuntimeState;
	grandPrix: GrandPrixRuntimeState;
	gradeChallenge: GradeChallengeRuntimeState;
	gradeLive: GradeLiveRuntimeState;
}>;

export function getServerRuntimeDefaultsFromDatabase(
	database: Database,
): ServerRuntimeDefaults {
	const chapter = getLatestChapterRuntimeDefaultsFromDatabase(database);
	if (chapter === undefined) throw new Error('Chapter master not found');
	const grandPrix = getGrandPrixAdminSummaryFromDatabase(database)[0];
	if (grandPrix === undefined) throw new Error('Grand prix master not found');
	const grandPrixDefaults = getGrandPrixMasterRuntimeDefaultsFromDatabase(
		database,
		grandPrix.grandPrixId,
	);
	if (grandPrixDefaults === undefined)
		throw new Error('Grand prix runtime master not found');
	return {
		chapter: {
			activeChapterId: chapter.chapterId,
			startDate: chapter.startDate,
			endDate: chapter.endDate,
		},
		grandPrix: {
			activeGrandPrixId: grandPrix.grandPrixId,
			...grandPrixDefaults,
			status: 2,
			guildTotalPoint: 0,
			guildRanking: 0,
			withinGuildRanking: 0,
			personalTotalPoint: 0,
			personalRanking: 0,
			stageOverrides: [],
		},
		gradeChallenge:
			getLatestGradeChallengeMasterRuntimeDefaultsFromDatabase(database),
		gradeLive: getCurrentGradeLiveMasterRuntimeDefaultsFromDatabase(database),
	};
}
