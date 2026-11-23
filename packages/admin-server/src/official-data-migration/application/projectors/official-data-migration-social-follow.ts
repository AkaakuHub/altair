import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import type {
	FollowRelationState,
	OfficialFollowInfoState,
} from '../../../../../../src/state/follow-state.ts';
import {
	type JsonRecord,
	readNumber,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';
import { upsertRegisteredUserFromFollowInfo } from './official-data-migration-social-account.ts';
import {
	createFriendCardFromFollowInfo,
	upsertUserFriendCard,
} from './official-data-migration-social-friend-card.ts';

export function applyFollowInfoEntry(
	state: ServerState,
	playerId: string,
	entry: JsonRecord,
	isFollowList: boolean,
): void {
	const targetPlayerId = readString(entry.player_id);
	if (targetPlayerId === null || targetPlayerId === playerId) return;
	upsertRegisteredUserFromFollowInfo(state, entry);
	const officialInfo = createOfficialFollowInfo(entry);
	if (isFollowList || readNumber(entry.follow_status) === 1)
		upsertFollowRelation(
			state,
			createFollowRelation(playerId, targetPlayerId, officialInfo),
		);
	if (!isFollowList)
		upsertFollowRelation(
			state,
			createFollowRelation(targetPlayerId, playerId, officialInfo),
		);
	else if (readNumber(entry.follower_status) === 1)
		upsertFollowRelation(state, {
			playerId: targetPlayerId,
			targetPlayerId: playerId,
		});
	const friendCard = createFriendCardFromFollowInfo(targetPlayerId, entry);
	if (friendCard !== null) upsertUserFriendCard(state, friendCard);
}

function createFollowRelation(
	playerId: string,
	targetPlayerId: string,
	officialInfo: OfficialFollowInfoState | undefined,
): FollowRelationState {
	const relation: FollowRelationState = { playerId, targetPlayerId };
	if (officialInfo !== undefined) relation.officialInfo = officialInfo;
	return relation;
}

function createOfficialFollowInfo(
	entry: JsonRecord,
): OfficialFollowInfoState | undefined {
	const name = readString(entry.name);
	const fanLevel = readNumber(entry.fan_level);
	const profileIconPartsInfo =
		typeof entry.profile_icon_parts_info === 'string'
			? entry.profile_icon_parts_info
			: null;
	if (name === null || fanLevel === null || profileIconPartsInfo === null)
		return undefined;
	return {
		comment: readString(entry.comment) ?? '',
		fanLevel,
		friendCardInfo: readRecordArray(entry.friend_card_info).map((info) =>
			structuredClone(info),
		),
		lastLoginDateTime: readString(entry.last_login_date_time),
		name,
		profileIconPartsInfo,
	};
}

function upsertFollowRelation(
	state: ServerState,
	relation: FollowRelationState,
): void {
	const index = state.followRelations.findIndex(
		(current) =>
			current.playerId === relation.playerId &&
			current.targetPlayerId === relation.targetPlayerId,
	);
	if (index >= 0)
		state.followRelations[index] = {
			...state.followRelations[index],
			...relation,
		};
	else state.followRelations.push(relation);
}
