import { randomUUID } from 'node:crypto';
import type {
	RegisteredUserState,
	ServerState,
} from '../../../../../../src/server-state-schema.ts';
import {
	type JsonRecord,
	readNumber,
	readProfileInfo,
	readString,
} from '../official-data-migration-dump.ts';
import { upsertMigrationPlayerState } from './official-data-migration-apply-upsert.ts';

const unsetDate = '0001-01-01T00:00:00Z';

export function upsertRegisteredUser(
	state: ServerState,
	playerId: string,
	deviceSpecificId: string | null,
	profileResponse: JsonRecord | undefined,
): void {
	const existing = state.registeredUsers.find(
		(user) => user.playerId === playerId,
	);
	const profile = readProfileInfo(profileResponse);
	const user: RegisteredUserState = {
		playerId,
		deviceSpecificId:
			deviceSpecificId ?? existing?.deviceSpecificId ?? randomUUID(),
		sessionToken: existing?.sessionToken ?? randomUUID(),
		playerName:
			readString(profile?.player_name) ??
			readString(profile?.name) ??
			existing?.playerName ??
			playerId,
		birthday: readString(profile?.birthday) ?? existing?.birthday ?? unsetDate,
		entryTime:
			readString(profile?.entry_time) ?? existing?.entryTime ?? unsetDate,
		lastLoginDate:
			readString(profile?.last_login_date) ??
			existing?.lastLoginDate ??
			unsetDate,
		playerLevel:
			readNumber(profile?.player_level) ?? existing?.playerLevel ?? 1,
	};
	if (existing?.platformType !== undefined) {
		user.platformType = existing.platformType;
	}
	upsertMigrationPlayerState(state.registeredUsers, user);
}
