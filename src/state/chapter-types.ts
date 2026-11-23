import type { EntityProvenance } from './entity-provenance.ts';

export type ChapterCategoryPointState = {
	categoryId: number;
	currentPoint: number;
};
export type ChapterMissionProgressState = {
	missionId: number;
	achievedNum: number;
	isAchieved: boolean;
	isReceived: boolean;
};
export type UserChapterState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityProvenance['identityFingerprint'];
	playerId: string;
	chapterId: number;
	currentPoint: number;
	categoryPoints: ChapterCategoryPointState[];
	missionProgresses: ChapterMissionProgressState[];
	claimedPointRewardIds: number[];
};
