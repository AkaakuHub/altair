import type { EntityIdentityFingerprint } from './entity-provenance.ts';

export type UserQuestStageProgressState = {
	questLiveType: number;
	stageId: number;
	highScore: number;
	bestLoveMusicId?: number;
	playCount: number;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
};

export type UserDreamLiveProgressState = {
	stageId: number;
	clearTimes: number;
	isGetCard: boolean;
	limitBreakTimes: number;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
};

export type UserQuestProgressStateOwner = {
	questStageProgressList: UserQuestStageProgressState[];
	dreamLiveProgressList: UserDreamLiveProgressState[];
};
