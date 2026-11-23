import { isRecord } from '../../state/json-state-utils.ts';

export function readRecoveryCount(body: unknown): number | undefined {
	if (!isRecord(body)) {
		return undefined;
	}
	const value = body.recovery_count;
	return typeof value === 'number' && Number.isInteger(value)
		? value
		: undefined;
}

export function getQuestStageId(body: unknown): number | null {
	if (!isRecord(body)) {
		return null;
	}
	const stageId = body.stage_id;
	return typeof stageId === 'number' && Number.isInteger(stageId)
		? stageId
		: null;
}

export function getSkipQuestLiveType(body: unknown): number | null {
	if (!isRecord(body)) {
		return null;
	}
	const questLiveType = body.quest_live_type;
	return typeof questLiveType === 'number' && Number.isInteger(questLiveType)
		? questLiveType
		: null;
}

export function getSkipCount(body: unknown): number | null {
	if (!isRecord(body)) {
		return null;
	}
	const skipCount = body.skip_count;
	return typeof skipCount === 'number' &&
		Number.isSafeInteger(skipCount) &&
		skipCount > 0
		? skipCount
		: null;
}
