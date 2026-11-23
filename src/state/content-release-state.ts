import { isRecord } from './json-state-utils.ts';

export type ContentReleaseEffectState = {
	playerId: string;
	contentsId: number;
	status: number;
};

export function setContentReleaseEffectHistory(
	histories: ContentReleaseEffectState[],
	playerId: string,
	contentsId: number,
): ContentReleaseEffectState[] {
	const existing = histories.find(
		(history) =>
			history.playerId === playerId && history.contentsId === contentsId,
	);
	if (existing) {
		existing.status = 1;
		return histories;
	}
	return [...histories, { playerId, contentsId, status: 1 }];
}

export function isContentReleaseEffectState(
	value: unknown,
): value is ContentReleaseEffectState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		typeof value.contentsId === 'number' &&
		typeof value.status === 'number'
	);
}
