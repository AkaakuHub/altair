import { randomUUID } from 'node:crypto';
import type { UserStatusController } from '../../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import { ensureUserHeaderState } from '../../../../../../src/state/user-header-state.ts';
import {
	type JsonRecord,
	readString,
} from '../official-data-migration-dump.ts';

const unsetDate = '0001-01-01T00:00:00Z';

export function upsertOfficialDataMigrationCircleCommenter(
	state: ServerState,
	commenter: JsonRecord,
	userStatus: UserStatusController,
): void {
	const playerId = readString(commenter.player_id);
	if (playerId === null || playerId.length === 0) {
		return;
	}
	const existing = state.registeredUsers.find(
		(user) => user.playerId === playerId,
	);
	if (existing !== undefined) {
		return;
	}
	state.registeredUsers.push({
		playerId,
		deviceSpecificId: randomUUID(),
		sessionToken: randomUUID(),
		playerName: readString(commenter.player_name) ?? playerId,
		birthday: unsetDate,
		entryTime: unsetDate,
		lastLoginDate: unsetDate,
		playerLevel: 1,
	});
	ensureUserHeaderState(state, playerId);
	userStatus.ensure(state, playerId);
}
