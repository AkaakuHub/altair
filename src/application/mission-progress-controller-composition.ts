import type { ServerState } from '../server-state-schema.ts';
import { syncBeginnerMissionUserContent } from './beginner-mission-user-content-service.ts';
import type {
	MissionProgressController,
	MissionProgressMasterSource,
} from './mission-progress-controller-types.ts';
import { applyMissionProgressPlan } from './mission-progress-event-plan-apply.ts';
import { createMissionProgressPlan } from './mission-progress-plan.ts';
import {
	syncMissionListStars,
	syncSchoolStageStars,
	syncUserLiveStars,
} from './mission-progress-star-sync.ts';

export function createMissionProgressController(
	state: ServerState,
	masterSource: MissionProgressMasterSource,
): MissionProgressController {
	const isCompatible =
		masterSource.isStandardQuestProgressCompatible ?? (() => true);
	const starSource = {
		...(masterSource.sourceMasterReleaseId === undefined
			? {}
			: { sourceMasterReleaseId: masterSource.sourceMasterReleaseId }),
		getMissionGroups: masterSource.getMissionGroups,
		isCompatible,
	};
	return {
		apply: (event) =>
			applyMissionProgressPlan(
				state,
				createMissionProgressPlan(event, isCompatible),
				masterSource,
			),
		syncSchoolStageStars: (playerId, userLive) =>
			syncSchoolStageStars(state, playerId, userLive, starSource),
		syncForMissionList: (playerId, gameDate, userLive) =>
			syncMissionListStars(state, playerId, gameDate, userLive, starSource),
		syncLiveStars: (playerId, userLive) =>
			syncUserLiveStars(state, playerId, userLive, starSource),
		syncUserContent: (playerId, source) =>
			syncBeginnerMissionUserContent(
				state,
				playerId,
				source,
				masterSource.getBeginnerMissionCategories(),
				masterSource.sourceMasterReleaseId,
			),
	};
}
