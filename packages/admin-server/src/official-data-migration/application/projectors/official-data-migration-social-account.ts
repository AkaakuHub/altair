import { randomUUID } from 'node:crypto';
import type {
	RegisteredUserState,
	ServerState,
} from '../../../../../../src/server-state-schema.ts';
import {
	type JsonRecord,
	readString,
} from '../official-data-migration-dump.ts';

const unsetDate = '0001-01-01T00:00:00Z';

export function upsertRegisteredUserFromFollowInfo(
	state: ServerState,
	entry: JsonRecord,
): void {
	const playerId = readString(entry.player_id);
	if (playerId === null) return;
	const existing = state.registeredUsers.find(
		(user) => user.playerId === playerId,
	);
	const user: RegisteredUserState = {
		playerId,
		deviceSpecificId: existing?.deviceSpecificId ?? randomUUID(),
		sessionToken: existing?.sessionToken ?? randomUUID(),
		playerName: readString(entry.name) ?? existing?.playerName ?? playerId,
		birthday: existing?.birthday ?? unsetDate,
		entryTime: existing?.entryTime ?? unsetDate,
		lastLoginDate:
			readString(entry.last_login_date_time) ??
			existing?.lastLoginDate ??
			unsetDate,
		playerLevel: existing?.playerLevel ?? 1,
	};
	if (existing?.platformType !== undefined)
		user.platformType = existing.platformType;
	const index = state.registeredUsers.findIndex(
		(current) => current.playerId === playerId,
	);
	if (index === -1) state.registeredUsers.push(user);
	else state.registeredUsers[index] = user;
}
