import { isActivityRecordAdvDataWatched } from '../state/activity-record-mutation.ts';
import type { UserActivityRecordState } from '../state/activity-record-types.ts';
import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';

export function shouldAddActivityRecordFirstWatchPresent(
	activityRecord: UserActivityRecordState,
	advDataId: number,
	isLatestSeries: boolean,
	identityFingerprint: EntityIdentityFingerprint,
): boolean {
	return (
		!isActivityRecordAdvDataWatched(
			activityRecord,
			advDataId,
			identityFingerprint,
		) && isLatestSeries
	);
}
