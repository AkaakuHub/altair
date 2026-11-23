import { isArrayOf, isRecord } from './json-state-utils.ts';
import type {
	FanLevelEarnProgressState,
	FanLevelPointHistoryState,
	FanLevelSeasonPointHistoryState,
	MemberFanLevelState,
	SeasonFanLevelState,
	SeasonMemberFanLevelState,
	UserStatusState,
} from './user-status-types.ts';

export function isUserStatusState(value: unknown): value is UserStatusState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		typeof value.jewelFree === 'number' &&
		typeof value.jewelPaidApple === 'number' &&
		typeof value.jewelPaidGoogle === 'number' &&
		typeof value.jewelStaminaRecoveryCount === 'number' &&
		(value.jewelStaminaRecoveryGameDate === null ||
			typeof value.jewelStaminaRecoveryGameDate === 'string') &&
		typeof value.staminaNow === 'number' &&
		typeof value.staminaMax === 'number' &&
		typeof value.staminaRecoveryTime === 'string' &&
		typeof value.seasonFanLevelSeasonId === 'number' &&
		typeof value.seasonFanLevelPointStock === 'number' &&
		typeof value.seasonFanLevelPointStockLimit === 'number' &&
		isArrayOf(value.memberFanLevels, isMemberFanLevelState) &&
		(value.seasonFanLevels === undefined ||
			isArrayOf(value.seasonFanLevels, isSeasonFanLevelState)) &&
		isArrayOf(value.fanLevelEarnProgresses, isFanLevelEarnProgressState)
	);
}

function isMemberFanLevelState(value: unknown): value is MemberFanLevelState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.characterId === 'number' &&
		typeof value.dSeasonFanLevel === 'number' &&
		typeof value.dSeasonFanExperience === 'number' &&
		typeof value.memberFanLevel === 'number' &&
		typeof value.memberFanExperience === 'number'
	);
}

function isSeasonFanLevelState(value: unknown): value is SeasonFanLevelState {
	return (
		isRecord(value) &&
		typeof value.seasonId === 'number' &&
		typeof value.pointStock === 'number' &&
		typeof value.pointStockLimit === 'number' &&
		isArrayOf(value.memberFanLevels, isSeasonMemberFanLevelState)
	);
}

function isSeasonMemberFanLevelState(
	value: unknown,
): value is SeasonMemberFanLevelState {
	return (
		isRecord(value) &&
		typeof value.characterId === 'number' &&
		typeof value.dSeasonFanLevel === 'number' &&
		typeof value.dSeasonFanExperience === 'number'
	);
}

export function isFanLevelEarnProgressState(
	value: unknown,
): value is FanLevelEarnProgressState {
	return (
		isRecord(value) &&
		typeof value.characterId === 'number' &&
		typeof value.earnType === 'number' &&
		typeof value.totalPoint === 'number' &&
		isArrayOf(value.seasonPointHistoryList, isFanLevelSeasonPointHistoryState)
	);
}

function isFanLevelSeasonPointHistoryState(
	value: unknown,
): value is FanLevelSeasonPointHistoryState {
	return (
		isRecord(value) &&
		typeof value.seasonId === 'number' &&
		isArrayOf(value.pointHistoryList, isFanLevelPointHistoryState)
	);
}

function isFanLevelPointHistoryState(
	value: unknown,
): value is FanLevelPointHistoryState {
	return (
		isRecord(value) &&
		typeof value.date === 'string' &&
		typeof value.message === 'string' &&
		typeof value.point === 'number'
	);
}
