import type { Database } from 'bun:sqlite';
import { getBeginnerMissionCategoriesFromDatabase } from '../../../../src/master-data/beginner-mission-master-data.ts';
import { getChapterProvenance } from '../../../../src/master-data/chapter-identity.ts';
import { getActiveChapterMasterFromDatabase } from '../../../../src/master-data/chapter-master-data.ts';
import { getStepUpBeginnerMissionsFromDatabase } from '../../../../src/master-data/step-up-beginner-mission-master-data.ts';
import { ensureChapterRuntimeState } from '../../../../src/server-state.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import { ensureUserBeginnerMissionState } from '../../../../src/state/beginner-mission-aggregate-state.ts';
import { ensureUserChapterState } from '../../../../src/state/chapter-aggregate-state.ts';
import { ensureUserMissionState } from '../../../../src/state/mission-progress-aggregate.ts';
import { ensureUserStepUpBeginnerMissionState } from '../../../../src/state/step-up-beginner-mission-state.ts';
import { ensureUserLiveState } from '../../../../src/state/user-live-state.ts';

export function ensureAdminVisibleUserMissionState(
	state: ServerState,
	database: Database,
	masterReleaseId: string,
): void {
	const playerId = state.selectedAdminPlayerId;
	if (!playerId) {
		return;
	}
	ensureUserMissionState(state, playerId);
	ensureUserLiveState(state, playerId);
	const chapterMaster = getActiveChapterMasterFromDatabase(
		database,
		ensureChapterRuntimeState(state),
	);
	const provenance = getChapterProvenance(
		database,
		masterReleaseId,
		chapterMaster.chapterId,
	);
	if (provenance === undefined) return;
	const chapterResult = ensureUserChapterState(
		state.userChapters,
		playerId,
		chapterMaster,
		provenance,
	);
	state.userChapters = chapterResult.chapters;
	const beginnerResult = ensureUserBeginnerMissionState(
		state.userBeginnerMissions,
		playerId,
		getBeginnerMissionCategoriesFromDatabase(database),
	);
	state.userBeginnerMissions = beginnerResult.missions;
	ensureUserStepUpBeginnerMissionState(
		state,
		playerId,
		getStepUpBeginnerMissionsFromDatabase(database),
	);
}
