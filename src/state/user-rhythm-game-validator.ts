import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import {
	isArrayOf,
	isJsonObject,
	isJsonValue,
	isRecord,
} from './json-state-utils.ts';
import type {
	UserCurrentRhythmGameState,
	UserRhythmGameClassMissionReceivedOrderState,
	UserRhythmGameDeckState,
	UserRhythmMusicScoreState,
} from './user-rhythm-game-types.ts';

const isFingerprint = (value: unknown): value is EntityIdentityFingerprint =>
	isRecord(value) &&
	typeof value.domain === 'string' &&
	typeof value.value === 'string';
export function isUserCurrentRhythmGameState(
	value: unknown,
): value is UserCurrentRhythmGameState {
	return (
		isRecord(value) &&
		(value.masterReleaseId === undefined ||
			typeof value.masterReleaseId === 'string') &&
		typeof value.musicId === 'number' &&
		typeof value.difficulty === 'number' &&
		(value.consumeStaminaMagnification === undefined ||
			typeof value.consumeStaminaMagnification === 'number')
	);
}
export function isUserRhythmMusicScoreState(
	value: unknown,
): value is UserRhythmMusicScoreState {
	return (
		isRecord(value) &&
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			isFingerprint(value.identityFingerprint)) &&
		typeof value.musicId === 'number' &&
		typeof value.highScore === 'number' &&
		typeof value.highScoreAchievementStatus === 'number' &&
		typeof value.clearCount === 'number' &&
		typeof value.totalScoreAccumulated === 'number' &&
		typeof value.musicMasteryLevel === 'number' &&
		(value.musicMasteryExperience === undefined ||
			typeof value.musicMasteryExperience === 'number') &&
		isArrayOf(value.difficultyScores, isJsonObject)
	);
}
export function isUserRhythmGameClassMissionReceivedOrderState(
	value: unknown,
): value is UserRhythmGameClassMissionReceivedOrderState {
	return (
		isRecord(value) &&
		typeof value.conditionType === 'number' &&
		typeof value.receivedOrder === 'number'
	);
}
export function isUserRhythmGameDeckState(
	value: unknown,
): value is UserRhythmGameDeckState {
	return (
		isRecord(value) &&
		typeof value.rhythmGameDeckId === 'string' &&
		typeof value.name === 'string' &&
		typeof value.deckNo === 'number' &&
		isArrayOf(value.deckCardList, isJsonValue)
	);
}
