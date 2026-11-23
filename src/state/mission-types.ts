import type { EntityIdentityFingerprint } from './entity-provenance.ts';

export type UserMissionState = {
	playerId: string;
	commonMissionInfo: MissionCommonInfoState;
	missionProgresses: MissionProgressState[];
	dailyMissionGameDate: string | null;
};

export type MissionCommonInfoState = {
	receivedOrder: number;
	receivedRewards?: MissionCommonRewardReceivedState[];
	rhythmGameStar: number;
	schoolStageStar: number;
};

export type MissionCommonRewardReceivedState = {
	commonMissionId: number;
	orderId: number;
	sourceMasterReleaseId: string;
	identityFingerprint: EntityIdentityFingerprint;
};

export type MissionProgressState = {
	missionId: number;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	achievedNum: number;
	isAchieved: boolean;
};

export type MissionRewardState = {
	rewardType: number;
	itemType: number;
	itemId: number;
	rewardNum: number;
};
