import type { EntityIdentityFingerprint } from './entity-provenance.ts';

export type UserCurrentRhythmGameGrandPrixState = {
	masterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	grandPrixId: number;
	grandPrixRhythmGameSeriesId: number;
	musicId: number;
	difficulty: number;
	friendCardPlayerId: string;
	friendCardId: string;
};

export type UserRhythmGameGrandPrixDeckCardState = {
	seriesDeckCardDatasId: string;
	dCardDatasId: string;
	slotNo: number;
	isCenter: boolean;
};

export type UserRhythmGameGrandPrixSeriesProgressState = {
	grandPrixRhythmGameSeriesId: number;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	highScore: number;
	currentDailyPoint: number;
	playCount: number;
	deckCardList: UserRhythmGameGrandPrixDeckCardState[];
};

export type UserRhythmGameGrandPrixState = {
	grandPrixId: number;
	seriesProgressList: UserRhythmGameGrandPrixSeriesProgressState[];
};

export type UserRhythmGameGrandPrixContainer = {
	rhythmGameGrandPrixes: UserRhythmGameGrandPrixState[];
};
