import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import type { UserSocialState } from '../../../../../../src/state/social-types.ts';
import {
	type JsonRecord,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function readMutePlayerIds(response: JsonRecord | undefined): string[] {
	if (response === undefined) return [];
	return [
		...readRecordArray(response.mute_player_list),
		...readRecordArray(response.mute_list),
	]
		.map((entry) => readString(entry.player_id))
		.filter((playerId): playerId is string => playerId !== null);
}

export function upsertUserSocial(
	state: ServerState,
	social: UserSocialState,
): void {
	const index = state.userSocials.findIndex(
		(current) => current.playerId === social.playerId,
	);
	if (index === -1) state.userSocials.push(social);
	else state.userSocials[index] = social;
}
