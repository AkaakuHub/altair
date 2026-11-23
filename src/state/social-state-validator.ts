import { isRecord } from './json-state-utils.ts';
import type {
	UserReportApplicationState,
	UserSocialState,
} from './social-types.ts';

export function isUserSocialState(value: unknown): value is UserSocialState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		Array.isArray(value.mutePlayerIds) &&
		value.mutePlayerIds.every((playerId) => typeof playerId === 'string') &&
		Array.isArray(value.reportApplications) &&
		value.reportApplications.every(isUserReportApplicationState)
	);
}

function isUserReportApplicationState(
	value: unknown,
): value is UserReportApplicationState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		typeof value.reportType === 'number'
	);
}
