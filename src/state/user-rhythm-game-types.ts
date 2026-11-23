import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import type { JsonObject, JsonValue } from './json-state-utils.ts';
export type UserCurrentRhythmGameState = {
	masterReleaseId?: string;
	musicId: number;
	difficulty: number;
	consumeStaminaMagnification?: number;
};
export type UserRhythmMusicScoreState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	musicId: number;
	highScore: number;
	highScoreAchievementStatus: number;
	clearCount: number;
	totalScoreAccumulated: number;
	musicMasteryLevel: number;
	musicMasteryExperience: number;
	difficultyScores: JsonObject[];
};
export type UserRhythmGameClassMissionReceivedOrderState = {
	conditionType: number;
	receivedOrder: number;
};
export type UserRhythmGameDeckState = {
	rhythmGameDeckId: string;
	name: string;
	deckNo: number;
	deckCardList: JsonValue[];
};
export type UserRhythmGameStateOwner = {
	rhythmMusicScores: UserRhythmMusicScoreState[];
	rhythmGameClassMissionReceivedOrders: UserRhythmGameClassMissionReceivedOrderState[];
	rhythmGameDecks: UserRhythmGameDeckState[];
};
