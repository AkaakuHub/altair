import type { ServerState } from '../server-state-schema.ts';
import { getFanLevelEarnProgressesForCharacter } from './user-status-member-fan-level.ts';
import type { UserStatusAccess } from './user-status-port.ts';
import type { FanLevelEarnProgressState } from './user-status-types.ts';

export function createFanLevelEarnProgressMap(
	state: ServerState,
	playerId: string,
	userStatus: UserStatusAccess,
): ReadonlyMap<number, readonly FanLevelEarnProgressState[]> {
	const status = userStatus.ensure(state, playerId).value;
	return new Map(
		status.memberFanLevels.map((memberFanLevel) => [
			memberFanLevel.characterId,
			getFanLevelEarnProgressesForCharacter(status, memberFanLevel.characterId),
		]),
	);
}
