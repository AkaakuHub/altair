import { isArrayOf, isRecord } from './json-state-utils.ts';
import type {
	MissionCommonInfoState,
	MissionCommonRewardReceivedState,
	MissionProgressState,
	UserMissionState,
} from './mission-types.ts';

export function isUserMissionState(value: unknown): value is UserMissionState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		isMissionCommonInfoState(value.commonMissionInfo) &&
		isArrayOf(value.missionProgresses, isMissionProgressState) &&
		(value.dailyMissionGameDate === null ||
			typeof value.dailyMissionGameDate === 'string')
	);
}

function isMissionCommonInfoState(
	value: unknown,
): value is MissionCommonInfoState {
	return (
		isRecord(value) &&
		typeof value.receivedOrder === 'number' &&
		(value.receivedRewards === undefined ||
			isArrayOf(value.receivedRewards, isMissionCommonRewardReceivedState)) &&
		typeof value.rhythmGameStar === 'number' &&
		typeof value.schoolStageStar === 'number'
	);
}

function isMissionCommonRewardReceivedState(
	value: unknown,
): value is MissionCommonRewardReceivedState {
	return (
		isRecord(value) &&
		typeof value.commonMissionId === 'number' &&
		typeof value.orderId === 'number' &&
		typeof value.sourceMasterReleaseId === 'string' &&
		isRecord(value.identityFingerprint) &&
		typeof value.identityFingerprint.domain === 'string' &&
		typeof value.identityFingerprint.value === 'string'
	);
}

function isMissionProgressState(value: unknown): value is MissionProgressState {
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
		typeof value.isAchieved === 'boolean'
	);
}
