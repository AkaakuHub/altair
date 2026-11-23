import {
	hasActivityRecordAdvMembership,
	setActivityRecordAdvMembership,
	setActivityRecordSeriesMembership,
} from './activity-record-membership.ts';
import type { UserActivityRecordState } from './activity-record-types.ts';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';

export function playActivityRecordAdvData(
	activityRecord: UserActivityRecordState,
	advDataId: number,
	provenance: EntityProvenance,
): void {
	setActivityRecordAdvWatched(activityRecord, advDataId, true, provenance);
	setActivityRecordAdvUnlocked(activityRecord, advDataId, false, provenance);
}

export function isActivityRecordAdvDataWatched(
	activityRecord: UserActivityRecordState,
	advDataId: number,
	targetFingerprint: EntityIdentityFingerprint,
): boolean {
	return hasActivityRecordAdvMembership(
		activityRecord.watchedActivityRecordAdvDataIds,
		activityRecord.watchedActivityRecordAdvMemberships ?? [],
		advDataId,
		targetFingerprint,
	);
}

export function unlockActivityRecordAdvData(
	activityRecord: UserActivityRecordState,
	advDataId: number,
	provenance: EntityProvenance,
): boolean {
	return setActivityRecordAdvUnlocked(
		activityRecord,
		advDataId,
		true,
		provenance,
	);
}

export function isActivityRecordAdvUnlockConditionSatisfied(
	activityRecord: UserActivityRecordState,
	conditionAdvDataId: number,
	targetFingerprint: EntityIdentityFingerprint | undefined,
): boolean {
	if (conditionAdvDataId <= 0) return true;
	if (targetFingerprint === undefined) return false;
	return (
		hasActivityRecordAdvMembership(
			activityRecord.watchedActivityRecordAdvDataIds,
			activityRecord.watchedActivityRecordAdvMemberships ?? [],
			conditionAdvDataId,
			targetFingerprint,
		) ||
		hasActivityRecordAdvMembership(
			activityRecord.unlockedActivityRecordAdvDataIds,
			activityRecord.unlockedActivityRecordAdvMemberships ?? [],
			conditionAdvDataId,
			targetFingerprint,
		)
	);
}

export function markActivityRecordMonthDisplayed(
	activityRecord: UserActivityRecordState,
	advSeriesId: number,
	provenance: EntityProvenance,
): void {
	setActivityRecordMonthDisplayed(
		activityRecord,
		advSeriesId,
		true,
		provenance,
	);
}

export function setActivityRecordAdvWatched(
	activityRecord: UserActivityRecordState,
	advDataId: number,
	isWatched: boolean,
	provenance: EntityProvenance,
): boolean {
	if (!isPositiveId(advDataId)) return false;
	if (!isWatched) {
		activityRecord.watchedActivityRecordAdvDataIds =
			activityRecord.watchedActivityRecordAdvDataIds.filter(
				(id) => id !== advDataId,
			);
	}
	activityRecord.watchedActivityRecordAdvMemberships =
		setActivityRecordAdvMembership(
			activityRecord.watchedActivityRecordAdvMemberships ?? [],
			advDataId,
			isWatched,
			provenance,
		);
	return true;
}

function setActivityRecordAdvUnlocked(
	activityRecord: UserActivityRecordState,
	advDataId: number,
	isUnlocked: boolean,
	provenance: EntityProvenance,
): boolean {
	if (!isPositiveId(advDataId)) return false;
	if (!isUnlocked) {
		activityRecord.unlockedActivityRecordAdvDataIds =
			activityRecord.unlockedActivityRecordAdvDataIds.filter(
				(id) => id !== advDataId,
			);
	}
	activityRecord.unlockedActivityRecordAdvMemberships =
		setActivityRecordAdvMembership(
			activityRecord.unlockedActivityRecordAdvMemberships ?? [],
			advDataId,
			isUnlocked,
			provenance,
		);
	return true;
}

export function setActivityRecordMonthDisplayed(
	activityRecord: UserActivityRecordState,
	advSeriesId: number,
	isDisplayed: boolean,
	provenance: EntityProvenance,
): boolean {
	if (!isPositiveId(advSeriesId)) return false;
	if (!isDisplayed) {
		activityRecord.displayedActivityRecordAdvSeriesIds =
			activityRecord.displayedActivityRecordAdvSeriesIds.filter(
				(id) => id !== advSeriesId,
			);
	}
	activityRecord.displayedActivityRecordAdvSeriesMemberships =
		setActivityRecordSeriesMembership(
			activityRecord.displayedActivityRecordAdvSeriesMemberships ?? [],
			advSeriesId,
			isDisplayed,
			provenance,
		);
	return true;
}

function isPositiveId(value: unknown): value is number {
	return Number.isSafeInteger(value) && Number(value) > 0;
}
