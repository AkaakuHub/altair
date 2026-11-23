export type UserBeginnerMissionState = {
	playerId: string;
	missionProgresses: BeginnerMissionProgressState[];
	receivedMissionIds: number[];
	receivedMissionTypes: number[];
	receivedMissionTypeProgresses?: BeginnerMissionTypeReceivedState[];
};

export type BeginnerMissionTypeReceivedState = {
	missionType: number;
	sourceMasterReleaseId: string;
	identityFingerprint: EntityIdentityFingerprint;
};

export type BeginnerMissionProgressState = {
	missionId: number;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	achievedNum: number;
	status: BeginnerMissionStatus;
};

export type BeginnerMissionStatus = 0 | 1 | 2;

import type { EntityIdentityFingerprint } from './entity-provenance.ts';
