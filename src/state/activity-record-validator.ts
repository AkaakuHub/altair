import type {
	ActivityRecordAdvMembership,
	ActivityRecordSeriesMembership,
	UserActivityRecordState,
} from './activity-record-types.ts';
import { isArrayOf, isRecord } from './json-state-utils.ts';

export function isUserActivityRecordState(
	value: unknown,
): value is UserActivityRecordState {
	if (!isRecord(value)) return false;
	return (
		typeof value.playerId === 'string' &&
		isArrayOf(value.watchedActivityRecordAdvDataIds, isNumber) &&
		isArrayOf(value.displayedActivityRecordAdvSeriesIds, isNumber) &&
		isArrayOf(value.unlockedActivityRecordAdvDataIds, isNumber) &&
		(value.watchedActivityRecordAdvMemberships === undefined ||
			isArrayOf(
				value.watchedActivityRecordAdvMemberships,
				isActivityRecordAdvMembership,
			)) &&
		(value.displayedActivityRecordAdvSeriesMemberships === undefined ||
			isArrayOf(
				value.displayedActivityRecordAdvSeriesMemberships,
				isActivityRecordSeriesMembership,
			)) &&
		(value.unlockedActivityRecordAdvMemberships === undefined ||
			isArrayOf(
				value.unlockedActivityRecordAdvMemberships,
				isActivityRecordAdvMembership,
			))
	);
}

function isActivityRecordAdvMembership(
	value: unknown,
): value is ActivityRecordAdvMembership {
	return (
		isRecord(value) && isPositiveId(value.advDataId) && isProvenance(value)
	);
}

function isActivityRecordSeriesMembership(
	value: unknown,
): value is ActivityRecordSeriesMembership {
	return (
		isRecord(value) && isPositiveId(value.advSeriesId) && isProvenance(value)
	);
}

function isProvenance(value: Record<string, unknown>): boolean {
	return (
		typeof value.sourceMasterReleaseId === 'string' &&
		isRecord(value.identityFingerprint) &&
		typeof value.identityFingerprint.domain === 'string' &&
		typeof value.identityFingerprint.value === 'string'
	);
}

function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}

function isPositiveId(value: unknown): value is number {
	return Number.isSafeInteger(value) && Number(value) > 0;
}
