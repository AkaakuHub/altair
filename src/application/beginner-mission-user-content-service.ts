import type { ServerState } from '../server-state-schema.ts';
import { ensureUserBeginnerMissionState } from '../state/beginner-mission-aggregate-state.ts';
import type { BeginnerMissionCategoryMaster } from '../state/beginner-mission-master.ts';
import {
	type BeginnerMissionUserContentSource,
	syncBeginnerMissionProgressFromUserContent,
} from '../state/beginner-mission-user-content-sync.ts';
import type { BeginnerMissionProgressSyncResult } from './mission-progress-controller-types.ts';

export function syncBeginnerMissionUserContent(
	state: ServerState,
	playerId: string,
	source: BeginnerMissionUserContentSource,
	categories: readonly BeginnerMissionCategoryMaster[],
	sourceMasterReleaseId?: string,
): BeginnerMissionProgressSyncResult {
	const count = state.userBeginnerMissions.length;
	const result = ensureUserBeginnerMissionState(
		state.userBeginnerMissions,
		playerId,
		categories,
	);
	state.userBeginnerMissions = result.missions;
	return {
		mission: result.mission,
		created: state.userBeginnerMissions.length !== count,
		progressChanged: syncBeginnerMissionProgressFromUserContent(
			result.mission,
			categories,
			source,
			sourceMasterReleaseId,
		),
	};
}
