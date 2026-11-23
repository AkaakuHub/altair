import type {
	BeginnerMissionProgressState,
	BeginnerMissionStatus,
	BeginnerMissionTypeReceivedState,
	UserBeginnerMissionState,
} from './beginner-mission-types.ts';
import { isArrayOf, isRecord } from './json-state-utils.ts';

export function isUserBeginnerMissionState(
	value: unknown,
): value is UserBeginnerMissionState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		isArrayOf(value.missionProgresses, isBeginnerMissionProgressState) &&
		isArrayOf(value.receivedMissionIds, isNumber) &&
		isArrayOf(value.receivedMissionTypes, isNumber) &&
		(value.receivedMissionTypeProgresses === undefined ||
			isArrayOf(
				value.receivedMissionTypeProgresses,
				isBeginnerMissionTypeReceivedState,
			))
	);
}

function isBeginnerMissionTypeReceivedState(
	value: unknown,
): value is BeginnerMissionTypeReceivedState {
	return (
		isRecord(value) &&
		typeof value.missionType === 'number' &&
		typeof value.sourceMasterReleaseId === 'string' &&
		isRecord(value.identityFingerprint) &&
		typeof value.identityFingerprint.domain === 'string' &&
		typeof value.identityFingerprint.value === 'string'
	);
}

function isBeginnerMissionProgressState(
	value: unknown,
): value is BeginnerMissionProgressState {
	return (
		isRecord(value) &&
		typeof value.missionId === 'number' &&
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string')) &&
		typeof value.achievedNum === 'number' &&
		isBeginnerMissionStatus(value.status)
	);
}

function isBeginnerMissionStatus(
	value: unknown,
): value is BeginnerMissionStatus {
	return value === 0 || value === 1 || value === 2;
}

function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}
