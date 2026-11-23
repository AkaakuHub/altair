import type { ServerState } from '../server-state-schema.ts';
import { ensureUserBeginnerMissionState } from '../state/beginner-mission-aggregate-state.ts';
import { incrementBeginnerMissionProgressByTransition } from '../state/beginner-mission-progress-state.ts';
import { resetDailyMissionProgressForGameDate } from '../state/mission-daily-reset.ts';
import { ensureUserMissionState } from '../state/mission-progress-aggregate.ts';
import {
	setRhythmGameStarMissionProgress,
	setSchoolStageStarMissionProgress,
} from '../state/mission-star-progress-sync.ts';
import { incrementMissionProgressByTransition } from '../state/mission-transition-progress.ts';
import type { MissionProgressMasterSource } from './mission-progress-controller-types.ts';
import type { MissionProgressPlan } from './mission-progress-plan.ts';

export function applyMissionProgressPlan(
	state: ServerState,
	plan: MissionProgressPlan,
	masterSource: MissionProgressMasterSource,
): void {
	const needsCommonMission =
		plan.dailyMissionGameDate !== undefined ||
		plan.commonTransitionId !== undefined ||
		plan.schoolStageStarTotal !== undefined ||
		plan.rhythmGameStarTotal !== undefined;
	const missionGroups = needsCommonMission
		? masterSource.getMissionGroups()
		: undefined;
	const mission = needsCommonMission
		? ensureUserMissionState(state, plan.playerId)
		: undefined;
	if (plan.dailyMissionGameDate && mission)
		resetDailyMissionProgressForGameDate(
			mission,
			missionGroups ?? [],
			plan.dailyMissionGameDate,
		);
	if (plan.commonTransitionId !== undefined && mission)
		incrementMissionProgressByTransition(
			mission,
			missionGroups ?? [],
			plan.commonTransitionId,
			1,
			masterSource.sourceMasterReleaseId,
		);
	if (plan.beginnerTransitionId !== undefined) {
		const categories = masterSource.getBeginnerMissionCategories();
		const result = ensureUserBeginnerMissionState(
			state.userBeginnerMissions,
			plan.playerId,
			categories,
		);
		state.userBeginnerMissions = result.missions;
		incrementBeginnerMissionProgressByTransition(
			result.mission,
			categories,
			plan.beginnerTransitionId,
			1,
			masterSource.sourceMasterReleaseId,
		);
	}
	if (plan.schoolStageStarTotal !== undefined && mission)
		setSchoolStageStarMissionProgress(
			mission,
			missionGroups ?? [],
			plan.schoolStageStarTotal,
			masterSource.sourceMasterReleaseId,
		);
	if (plan.rhythmGameStarTotal !== undefined && mission)
		setRhythmGameStarMissionProgress(mission, plan.rhythmGameStarTotal);
}
