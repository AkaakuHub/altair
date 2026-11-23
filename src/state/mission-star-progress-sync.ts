import type { MissionGroupMaster } from './mission-master.ts';
import { setMissionProgressByTransition } from './mission-transition-progress.ts';
import type { UserMissionState } from './mission-types.ts';

export function setSchoolStageStarMissionProgress(
	mission: UserMissionState,
	missionGroups: readonly MissionGroupMaster[],
	starTotal: number,
	sourceMasterReleaseId?: string,
): boolean {
	if (!Number.isSafeInteger(starTotal) || starTotal < 0) return false;
	mission.commonMissionInfo.schoolStageStar = starTotal;
	return setMissionProgressByTransition(
		mission,
		missionGroups,
		101,
		starTotal,
		sourceMasterReleaseId,
	);
}

export function setRhythmGameStarMissionProgress(
	mission: UserMissionState,
	starTotal: number,
): boolean {
	if (!Number.isSafeInteger(starTotal) || starTotal < 0) return false;
	mission.commonMissionInfo.rhythmGameStar = starTotal;
	return true;
}

export function getCommonMissionStarTotal(mission: UserMissionState): number {
	return (
		mission.commonMissionInfo.schoolStageStar +
		mission.commonMissionInfo.rhythmGameStar
	);
}
