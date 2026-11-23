import type { ServerState } from '../server-state-schema.ts';
import { resetDailyMissionProgressForGameDate } from '../state/mission-daily-reset.ts';
import type { MissionGroupMaster } from '../state/mission-master.ts';
import { ensureUserMissionState } from '../state/mission-progress-aggregate.ts';
import {
	calculateRhythmGameStarTotal,
	calculateStandardQuestStarTotal,
} from '../state/mission-star-progress.ts';
import {
	setRhythmGameStarMissionProgress,
	setSchoolStageStarMissionProgress,
} from '../state/mission-star-progress-sync.ts';
import type { UserMissionState } from '../state/mission-types.ts';
import type { UserLiveState } from '../state/user-live-state.ts';
import type { UserQuestStageProgressState } from '../state/user-quest-progress-types.ts';
import type { MissionProgressSyncResult } from './mission-progress-controller-types.ts';

type StarSyncSource = {
	sourceMasterReleaseId?: string;
	getMissionGroups: () => readonly MissionGroupMaster[];
	isCompatible: (progress: UserQuestStageProgressState) => boolean;
};

export function syncSchoolStageStars(
	state: ServerState,
	playerId: string,
	userLive: UserLiveState,
	source: StarSyncSource,
): void {
	setSchoolStageStarMissionProgress(
		ensureUserMissionState(state, playerId),
		source.getMissionGroups(),
		calculateStandardQuestStarTotal(userLive, source.isCompatible),
		source.sourceMasterReleaseId,
	);
}

export function syncMissionListStars(
	state: ServerState,
	playerId: string,
	gameDate: string,
	userLive: UserLiveState,
	source: StarSyncSource,
): MissionProgressSyncResult {
	const missionGroups = source.getMissionGroups();
	const count = state.userMissions.length;
	const mission = ensureUserMissionState(state, playerId);
	const dailyChanged = resetDailyMissionProgressForGameDate(
		mission,
		missionGroups,
		gameDate,
	);
	const starsChanged = syncLiveStars(
		mission,
		missionGroups,
		userLive,
		source.isCompatible,
		source.sourceMasterReleaseId,
	);
	return {
		mission,
		missionGroups,
		changed:
			state.userMissions.length !== count || dailyChanged || starsChanged,
	};
}

export function syncUserLiveStars(
	state: ServerState,
	playerId: string,
	userLive: UserLiveState,
	source: StarSyncSource,
): MissionProgressSyncResult {
	const missionGroups = source.getMissionGroups();
	const count = state.userMissions.length;
	const mission = ensureUserMissionState(state, playerId);
	return {
		mission,
		missionGroups,
		changed:
			state.userMissions.length !== count ||
			syncLiveStars(
				mission,
				missionGroups,
				userLive,
				source.isCompatible,
				source.sourceMasterReleaseId,
			),
	};
}

function syncLiveStars(
	mission: UserMissionState,
	groups: readonly MissionGroupMaster[],
	userLive: UserLiveState,
	isCompatible: (progress: UserQuestStageProgressState) => boolean,
	masterReleaseId?: string,
): boolean {
	const beforeSchool = mission.commonMissionInfo.schoolStageStar;
	const beforeRhythm = mission.commonMissionInfo.rhythmGameStar;
	setSchoolStageStarMissionProgress(
		mission,
		groups,
		calculateStandardQuestStarTotal(userLive, isCompatible),
		masterReleaseId,
	);
	setRhythmGameStarMissionProgress(
		mission,
		calculateRhythmGameStarTotal(userLive),
	);
	return (
		mission.commonMissionInfo.schoolStageStar !== beforeSchool ||
		mission.commonMissionInfo.rhythmGameStar !== beforeRhythm
	);
}
