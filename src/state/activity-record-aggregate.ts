import type { ServerState } from '../server-state-schema.ts';
import type { UserActivityRecordState } from './activity-record-types.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';

export function ensureUserActivityRecordState(
	state: Pick<ServerState, 'userActivityRecords'>,
	playerId: string,
): EnsureStateResult<UserActivityRecordState> {
	const existing = state.userActivityRecords.find(
		(activityRecord) => activityRecord.playerId === playerId,
	);
	if (existing) return { value: existing, created: false };
	const activityRecord = createUserActivityRecordState(playerId);
	state.userActivityRecords = [...state.userActivityRecords, activityRecord];
	return { value: activityRecord, created: true };
}

function createUserActivityRecordState(
	playerId: string,
): UserActivityRecordState {
	return {
		playerId,
		watchedActivityRecordAdvDataIds: [],
		displayedActivityRecordAdvSeriesIds: [],
		unlockedActivityRecordAdvDataIds: [],
		watchedActivityRecordAdvMemberships: [],
		displayedActivityRecordAdvSeriesMemberships: [],
		unlockedActivityRecordAdvMemberships: [],
	};
}
