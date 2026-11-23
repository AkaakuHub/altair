import type { UserFriendCardState } from './friend-card-types.ts';
import { isRecord } from './json-state-utils.ts';

export function isUserFriendCardState(
	value: unknown,
): value is UserFriendCardState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		typeof value.schoolIdolStageCardId === 'string' &&
		typeof value.rhythmGameCardId === 'string'
	);
}
