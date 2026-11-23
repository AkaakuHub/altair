import { isJsonObject, isRecord, type JsonObject } from './json-state-utils.ts';

export type UserCurrentQuestLiveState = {
	masterReleaseId?: string;
	questLiveId: string;
	questLiveType: number;
	stageId: number;
	musicId: number;
	isChallengeMode: boolean;
	isRehearsal?: boolean;
	deckData: JsonObject;
	characterBonus: JsonObject;
	startTime: string;
	score: number;
	playReport: string;
};

export function isUserCurrentQuestLiveState(
	value: unknown,
): value is UserCurrentQuestLiveState {
	if (!isRecord(value)) return false;
	return (
		(value.masterReleaseId === undefined ||
			typeof value.masterReleaseId === 'string') &&
		typeof value.questLiveId === 'string' &&
		typeof value.questLiveType === 'number' &&
		typeof value.stageId === 'number' &&
		typeof value.musicId === 'number' &&
		typeof value.isChallengeMode === 'boolean' &&
		(value.isRehearsal === undefined ||
			typeof value.isRehearsal === 'boolean') &&
		isJsonObject(value.deckData) &&
		isJsonObject(value.characterBonus) &&
		typeof value.startTime === 'string' &&
		typeof value.score === 'number' &&
		typeof value.playReport === 'string'
	);
}
