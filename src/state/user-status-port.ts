import type { EnsureStateResult } from './ensure-state-result.ts';
import type { UserStatusState } from './user-status-types.ts';

export type UserStatusAccess = {
	ensure: (
		state: { userStatuses: UserStatusState[] },
		playerId: string,
	) => EnsureStateResult<UserStatusState>;
};
