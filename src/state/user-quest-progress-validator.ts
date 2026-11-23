import { isRecord } from './json-state-utils.ts';
import type {
	UserDreamLiveProgressState,
	UserQuestStageProgressState,
} from './user-quest-progress-types.ts';

export function isUserDreamLiveProgressState(
	value: unknown,
): value is UserDreamLiveProgressState {
	if (!isRecord(value)) return false;
	return (
		typeof value.stageId === 'number' &&
		typeof value.clearTimes === 'number' &&
		typeof value.isGetCard === 'boolean' &&
		typeof value.limitBreakTimes === 'number' &&
		isOptionalQuestStageProvenance(value)
	);
}

export function isUserQuestStageProgressState(
	value: unknown,
): value is UserQuestStageProgressState {
	if (!isRecord(value)) return false;
	return (
		typeof value.questLiveType === 'number' &&
		typeof value.stageId === 'number' &&
		typeof value.highScore === 'number' &&
		(value.bestLoveMusicId === undefined ||
			typeof value.bestLoveMusicId === 'number') &&
		typeof value.playCount === 'number' &&
		isOptionalQuestStageProvenance(value)
	);
}

function isOptionalQuestStageProvenance(
	value: Record<string, unknown>,
): boolean {
	return (
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string'))
	);
}
