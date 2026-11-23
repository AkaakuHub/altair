import type { UserStatusController } from '../../application/user-status-controller.ts';
import type { CardMemberFanLevelState } from '../../state/card-member-fan-level-state.ts';
import type { UserStatusState } from '../../state/user-status-types.ts';

export function createCardMemberFanLevelsForResponse(
	userStatus: UserStatusController,
	status: UserStatusState,
): CardMemberFanLevelState[] {
	return userStatus.getCardMemberFanLevels(status);
}
