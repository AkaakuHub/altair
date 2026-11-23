import type { BeginnerMissionCategoryMaster } from '../state/beginner-mission-master.ts';
import type { UserBeginnerMissionState } from '../state/beginner-mission-types.ts';
import type { BeginnerMissionUserContentSource } from '../state/beginner-mission-user-content-sync.ts';
import type { MissionGroupMaster } from '../state/mission-master.ts';
import type { UserMissionState } from '../state/mission-types.ts';
import type { UserLiveState } from '../state/user-live-state.ts';
import type { UserQuestStageProgressState } from '../state/user-quest-progress-types.ts';
import type { MissionProgressEvent } from './mission-progress-plan.ts';

export type MissionProgressMasterSource = {
	sourceMasterReleaseId?: string;
	getMissionGroups: () => readonly MissionGroupMaster[];
	getBeginnerMissionCategories: () => readonly BeginnerMissionCategoryMaster[];
	isStandardQuestProgressCompatible?: (
		progress: UserQuestStageProgressState,
	) => boolean;
};

export type MissionProgressSyncResult = {
	mission: UserMissionState;
	missionGroups: readonly MissionGroupMaster[];
	changed: boolean;
};

export type BeginnerMissionProgressSyncResult = {
	mission: UserBeginnerMissionState;
	created: boolean;
	progressChanged: boolean;
};

export type MissionProgressController = {
	apply: (event: MissionProgressEvent) => void;
	syncSchoolStageStars: (playerId: string, userLive: UserLiveState) => void;
	syncForMissionList: (
		playerId: string,
		gameDate: string,
		userLive: UserLiveState,
	) => MissionProgressSyncResult;
	syncLiveStars: (
		playerId: string,
		userLive: UserLiveState,
	) => MissionProgressSyncResult;
	syncUserContent: (
		playerId: string,
		source: BeginnerMissionUserContentSource,
	) => BeginnerMissionProgressSyncResult;
};
