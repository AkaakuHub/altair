import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import type { MissionRewardState } from './mission-types.ts';

export type MissionGroupMaster = {
	missionType: number;
	startDate: string | null;
	endDate: string | null;
	achieveRewardList: MissionAchieveRewardMaster[];
	missionList: MissionMaster[];
};

export type MissionMaster = {
	missionId: number;
	name: string;
	description: string;
	conditionAchieveNum: number;
	rewardList: MissionRewardState[];
	transitionContentsId: number;
	identityFingerprint?: EntityIdentityFingerprint;
};

export type MissionAchieveRewardMaster = {
	targetNum: number;
	rewardList: MissionRewardState[];
};

export type CommonMissionRewardMaster = {
	commonMissionId: number;
	clearConditionNum: number;
	orderId: number;
	identityFingerprint?: EntityIdentityFingerprint;
	reward: {
		itemType: number;
		itemId: number;
		amount: number;
	};
};
