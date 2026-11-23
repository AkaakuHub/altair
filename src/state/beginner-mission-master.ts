export type BeginnerMissionCategoryMaster = {
	missionType: number;
	missionList: BeginnerMissionMaster[];
	identityFingerprint?: EntityIdentityFingerprint;
};

export type BeginnerMissionMaster = {
	missionId: number;
	name: string;
	description: string;
	conditionType: number;
	conditionAchieveNum: number;
	conditionDetail: number;
	transitionContentsId: number;
	sortOrder: number;
	identityFingerprint?: EntityIdentityFingerprint;
};

import type { EntityIdentityFingerprint } from './entity-provenance.ts';
