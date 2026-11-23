import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import type { MemberFanLevelDefinition } from './member-fan-level-definition.ts';
import { ensureCurrentSeasonFanLevel } from './season-fan-level-current-aggregate.ts';
import {
	mergeMemberFanLevelProgresses,
	mergeSeasonMemberFanLevelProgresses,
} from './season-fan-level-member-projection.ts';
import { STAMINA_RECOVERY_STOPPED_AT } from './stamina-recovery-time.ts';
import { normalizeFanLevelEarnProgresses } from './user-status-history.ts';
import { normalizeStaminaRecoveryTime } from './user-status-stamina.ts';
import type {
	UserStatusState,
	UserStatusUpdateValues,
} from './user-status-types.ts';

export function ensureUserStatus(
	state: { userStatuses: UserStatusState[] },
	playerId: string,
): EnsureStateResult<UserStatusState> {
	const existing = findUserStatus(state, playerId);
	if (existing) {
		return { value: existing, created: false };
	}
	const status = createDefaultUserStatus(playerId);
	state.userStatuses = [...state.userStatuses, status];
	return { value: status, created: true };
}

export function updateUserStatus(
	state: ServerState,
	playerId: string,
	values: UserStatusUpdateValues,
	memberFanLevelDefinitions: readonly MemberFanLevelDefinition[],
): boolean {
	const user = state.registeredUsers.find(
		(registeredUser) => registeredUser.playerId === playerId,
	);
	if (!user) {
		return false;
	}
	const status = ensureUserStatus(state, user.playerId).value;
	status.jewelFree = values.jewelFree;
	status.jewelPaidApple = values.jewelPaidApple;
	status.jewelPaidGoogle = values.jewelPaidGoogle;
	status.jewelStaminaRecoveryCount = values.jewelStaminaRecoveryCount;
	status.jewelStaminaRecoveryGameDate = values.jewelStaminaRecoveryGameDate;
	status.staminaNow = values.staminaNow;
	status.staminaMax = values.staminaMax;
	status.staminaRecoveryTime = values.staminaRecoveryTime;
	normalizeStaminaRecoveryTime(status);
	status.seasonFanLevelSeasonId = values.seasonFanLevelSeasonId;
	status.memberFanLevels = mergeMemberFanLevelProgresses(
		status.memberFanLevels,
		values.memberFanLevels,
		memberFanLevelDefinitions,
	);
	const currentSeasonFanLevel = ensureCurrentSeasonFanLevel(status);
	currentSeasonFanLevel.pointStock = values.seasonFanLevelPointStock;
	currentSeasonFanLevel.pointStockLimit = values.seasonFanLevelPointStockLimit;
	currentSeasonFanLevel.memberFanLevels = mergeSeasonMemberFanLevelProgresses(
		currentSeasonFanLevel.memberFanLevels,
		values.memberFanLevels,
		memberFanLevelDefinitions,
	);
	status.seasonFanLevelPointStock = currentSeasonFanLevel.pointStock;
	status.seasonFanLevelPointStockLimit = currentSeasonFanLevel.pointStockLimit;
	status.fanLevelEarnProgresses = normalizeFanLevelEarnProgresses(
		values.fanLevelEarnProgresses,
	);
	return true;
}

function findUserStatus(
	state: { userStatuses: UserStatusState[] },
	playerId: string,
): UserStatusState | undefined {
	return state.userStatuses.find((status) => status.playerId === playerId);
}

function createDefaultUserStatus(playerId: string): UserStatusState {
	return {
		playerId,
		jewelFree: 0,
		jewelPaidApple: 0,
		jewelPaidGoogle: 0,
		jewelStaminaRecoveryCount: 0,
		jewelStaminaRecoveryGameDate: null,
		staminaNow: 100,
		staminaMax: 100,
		staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT,
		seasonFanLevelSeasonId: 0,
		seasonFanLevelPointStock: 0,
		seasonFanLevelPointStockLimit: 0,
		memberFanLevels: [],
		seasonFanLevels: [],
		fanLevelEarnProgresses: [],
	};
}

export function createEmptyUserStatus(): UserStatusState {
	return {
		playerId: '',
		jewelFree: 0,
		jewelPaidApple: 0,
		jewelPaidGoogle: 0,
		jewelStaminaRecoveryCount: 0,
		jewelStaminaRecoveryGameDate: null,
		staminaNow: 100,
		staminaMax: 100,
		staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT,
		seasonFanLevelSeasonId: 0,
		seasonFanLevelPointStock: 0,
		seasonFanLevelPointStockLimit: 0,
		memberFanLevels: [],
		seasonFanLevels: [],
		fanLevelEarnProgresses: [],
	};
}
