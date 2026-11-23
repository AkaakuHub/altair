import { isRecord } from './json-state-utils.ts';
import type { UserRhythmGameGrandPrixState } from './rhythm-game-grand-prix-types.ts';

export function isUserRhythmGameGrandPrixState(
	value: unknown,
): value is UserRhythmGameGrandPrixState {
	return (
		isRecord(value) &&
		typeof value.grandPrixId === 'number' &&
		Array.isArray(value.seriesProgressList) &&
		value.seriesProgressList.every(isProgress)
	);
}

function isProgress(value: unknown): boolean {
	return (
		isRecord(value) &&
		typeof value.grandPrixRhythmGameSeriesId === 'number' &&
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			isIdentity(value.identityFingerprint)) &&
		typeof value.highScore === 'number' &&
		typeof value.currentDailyPoint === 'number' &&
		typeof value.playCount === 'number' &&
		Array.isArray(value.deckCardList) &&
		value.deckCardList.every(isDeckCard)
	);
}
function isIdentity(value: unknown): boolean {
	return (
		isRecord(value) &&
		typeof value.domain === 'string' &&
		typeof value.value === 'string'
	);
}
function isDeckCard(value: unknown): boolean {
	return (
		isRecord(value) &&
		typeof value.seriesDeckCardDatasId === 'string' &&
		typeof value.dCardDatasId === 'string' &&
		typeof value.slotNo === 'number' &&
		typeof value.isCenter === 'boolean'
	);
}
