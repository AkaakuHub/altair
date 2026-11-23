import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import { calculateFanLevel } from './fan-level-calculation.ts';
import type { MemberFanLevelDefinition } from './member-fan-level-definition.ts';
import {
	getCurrentSeasonFanLevelPointStock,
	getCurrentSeasonMemberFanLevels,
} from './season-fan-level-current-aggregate.ts';
import {
	cloneFanLevelEarnProgresses,
	cloneSeasonFanLevels,
} from './user-status-history.ts';
import { calculateCurrentUserStamina } from './user-status-stamina.ts';
import {
	createEmptyUserStatus,
	ensureUserStatus,
} from './user-status-state.ts';
import type { UserStatusState, UserStatusView } from './user-status-types.ts';

export function getUserStatusView(
	state: ServerState,
	user: RegisteredUserState | undefined,
	memberFanLevelDefinitions: readonly MemberFanLevelDefinition[],
): UserStatusView {
	if (user === undefined) {
		return createUserStatusView(
			state,
			undefined,
			createEmptyUserStatus(),
			memberFanLevelDefinitions,
		);
	}
	return createUserStatusView(
		state,
		user,
		ensureUserStatus(state, user.playerId).value,
		memberFanLevelDefinitions,
	);
}

function getUserPresentBoxCount(state: ServerState, playerId: string): number {
	return (
		state.userPresentBoxes.find(
			(presentBox) => presentBox.playerId === playerId,
		)?.presentList.length ?? 0
	);
}

function createUserStatusView(
	state: ServerState,
	user: RegisteredUserState | undefined,
	status: UserStatusState,
	memberFanLevelDefinitions: readonly MemberFanLevelDefinition[],
): UserStatusView {
	const playerId = user?.playerId ?? '';
	const currentStamina = calculateCurrentUserStamina(status);
	const currentSeasonFanLevelPointStock =
		getCurrentSeasonFanLevelPointStock(status);
	const currentSeasonMemberFanLevels = getCurrentSeasonMemberFanLevels(
		status,
		memberFanLevelDefinitions,
	);
	return {
		fanLevel: calculateFanLevel(status.memberFanLevels),
		jewelFree: status.jewelFree,
		jewelPaidApple: status.jewelPaidApple,
		jewelPaidGoogle: status.jewelPaidGoogle,
		jewelStaminaRecoveryCount: status.jewelStaminaRecoveryCount,
		jewelStaminaRecoveryGameDate: status.jewelStaminaRecoveryGameDate,
		presentBoxCount:
			playerId.length > 0 ? getUserPresentBoxCount(state, playerId) : 0,
		staminaNow: currentStamina.staminaNow,
		staminaMax: currentStamina.staminaMax,
		staminaRecoveryTime: currentStamina.staminaRecoveryTime,
		seasonFanLevelSeasonId: status.seasonFanLevelSeasonId,
		seasonFanLevelPointStock: currentSeasonFanLevelPointStock.pointStock,
		seasonFanLevelPointStockLimit:
			currentSeasonFanLevelPointStock.pointStockLimit,
		memberFanLevels: currentSeasonMemberFanLevels,
		fanLevelEarnProgresses: cloneFanLevelEarnProgresses(
			status.fanLevelEarnProgresses,
		),
		seasonFanLevels: cloneSeasonFanLevels(status.seasonFanLevels),
	};
}
