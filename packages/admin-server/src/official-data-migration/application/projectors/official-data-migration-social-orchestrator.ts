import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import type { OfficialDataMigrationDump } from '../official-data-migration-dump.ts';
import { readRecordArray } from '../official-data-migration-dump.ts';
import { applyFollowInfoEntry } from './official-data-migration-social-follow.ts';
import {
	readMutePlayerIds,
	upsertUserSocial,
} from './official-data-migration-social-mute.ts';

export function applySocialFromDump(
	state: ServerState,
	playerId: string,
	dump: OfficialDataMigrationDump,
): string[] {
	const appliedCategories: string[] = [];
	const followResponse = dump.responsesByPath.get('/v1/follow/get_list');
	const followerResponse = dump.responsesByPath.get(
		'/v1/follow/get_follower_list',
	);
	const muteResponse = dump.responsesByPath.get('/v1/profile/get_mute_list');
	const followEntries = readRecordArray(followResponse?.follow_info_list);
	const followerEntries = readRecordArray(followerResponse?.follower_info_list);
	if (followEntries.length > 0 || followerEntries.length > 0) {
		state.followRelations = state.followRelations.filter(
			(relation) =>
				relation.playerId !== playerId && relation.targetPlayerId !== playerId,
		);
		for (const entry of followEntries)
			applyFollowInfoEntry(state, playerId, entry, true);
		for (const entry of followerEntries)
			applyFollowInfoEntry(state, playerId, entry, false);
		appliedCategories.push('followRelations', 'userFriendCards');
	}
	if (muteResponse !== undefined) {
		upsertUserSocial(state, {
			playerId,
			mutePlayerIds: readMutePlayerIds(muteResponse),
			reportApplications: [],
		});
		appliedCategories.push('userSocials');
	}
	return appliedCategories;
}
