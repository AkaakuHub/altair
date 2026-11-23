import { isRecord } from './json-state-utils.ts';
import type { UserCurrentRhythmGameGrandPrixState } from './rhythm-game-grand-prix-types.ts';

export function isUserCurrentRhythmGameGrandPrixState(
	value: unknown,
): value is UserCurrentRhythmGameGrandPrixState {
	if (!isRecord(value)) return false;
	return (
		(value.masterReleaseId === undefined ||
			typeof value.masterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			isIdentity(value.identityFingerprint)) &&
		typeof value.grandPrixId === 'number' &&
		typeof value.grandPrixRhythmGameSeriesId === 'number' &&
		typeof value.musicId === 'number' &&
		typeof value.difficulty === 'number' &&
		typeof value.friendCardPlayerId === 'string' &&
		typeof value.friendCardId === 'string'
	);
}

function isIdentity(value: unknown): boolean {
	return (
		isRecord(value) &&
		typeof value.domain === 'string' &&
		typeof value.value === 'string'
	);
}
