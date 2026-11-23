import type {
	ChapterCategoryPointState,
	ChapterMissionProgressState,
	UserChapterState,
} from './chapter-types.ts';
import { isArrayOf, isRecord } from './json-state-utils.ts';

export function isUserChapterState(value: unknown): value is UserChapterState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		typeof value.chapterId === 'number' &&
		typeof value.currentPoint === 'number' &&
		isArrayOf(value.categoryPoints, isChapterCategoryPointState) &&
		isArrayOf(value.missionProgresses, isChapterMissionProgressState) &&
		isArrayOf(value.claimedPointRewardIds, isNumber) &&
		isOptionalChapterProvenance(value)
	);
}

function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}
function isOptionalChapterProvenance(value: Record<string, unknown>): boolean {
	return (
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string'))
	);
}
function isChapterCategoryPointState(
	value: unknown,
): value is ChapterCategoryPointState {
	return (
		isRecord(value) &&
		typeof value.categoryId === 'number' &&
		typeof value.currentPoint === 'number'
	);
}
function isChapterMissionProgressState(
	value: unknown,
): value is ChapterMissionProgressState {
	return (
		isRecord(value) &&
		typeof value.missionId === 'number' &&
		typeof value.achievedNum === 'number' &&
		typeof value.isAchieved === 'boolean' &&
		typeof value.isReceived === 'boolean'
	);
}
