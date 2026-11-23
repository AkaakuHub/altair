import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { isCircleMember } from '../../state/circle-member-state.ts';
import type {
	CircleMemberState,
	CircleState,
} from '../../state/circle-types.ts';
import type {
	CircleInfoResponse,
	CircleMemberResponse,
	CircleRankingInfoResponse,
} from '../response-types/circle-response-types.ts';
import {
	createProfileCardPartsInfo,
	createProfileIconPartsInfo,
} from './profile-icon-parts-response.ts';

export type CircleProfilePartsSource = Pick<
	ServerState,
	'grandPrix' | 'grandPrixRankings' | 'registeredUsers' | 'userProfileDesigns'
>;

export type CircleChatLogSource = Pick<
	ServerState,
	'registeredUsers' | 'userProfileDesigns'
>;

export function createCircleInfo(
	circle: CircleState,
	rankingInfo: CircleRankingInfoResponse,
): CircleInfoResponse {
	return {
		search_guild_key: circle.searchGuildKey,
		guild_id: circle.guildId,
		guild_name: circle.guildName,
		leader_player_id: circle.leaderPlayerId,
		guild_rank: circle.guildRank,
		guild_policy_action: circle.guildPolicyAction,
		guild_policy_recruiting: circle.guildPolicyRecruiting,
		guild_comment: circle.guildComment,
		guild_member_num: circle.members.length,
		guild_icon_parts_info: circle.guildIconPartsInfo,
		d_chat_rooms_id: circle.chatRoomId,
		feslive_rank_message: '',
		d_guild_invitations_id: '',
		circle_invitations_id: '',
		circle_ranking_info: rankingInfo,
		is_join_guild_ranking: circle.guildRank > 0,
	};
}

export function createCircleMembers(
	circle: CircleState,
	source: CircleProfilePartsSource,
): CircleMemberResponse[] {
	return circle.members.flatMap((member) => {
		const importedMember = createImportedCircleMember(member);
		if (importedMember !== null) {
			return [importedMember];
		}
		const user = source.registeredUsers.find(
			(registeredUser) => registeredUser.playerId === member.playerId,
		);
		return user ? [createCircleMember(source, user, member.positionType)] : [];
	});
}

function createImportedCircleMember(
	member: CircleMemberState,
): CircleMemberResponse | null {
	if (
		member.playerName === undefined ||
		member.playerLevel === undefined ||
		member.userType === undefined ||
		member.profileCardPartsInfo === undefined ||
		member.profileIconPartsInfo === undefined ||
		member.isMutePlayer === undefined ||
		member.isVoiceChatBan === undefined ||
		member.lastLoginDateTime === undefined
	) {
		return null;
	}
	return {
		player_id: member.playerId,
		player_name: member.playerName,
		player_level: member.playerLevel,
		user_type: member.userType,
		position_type: member.positionType,
		profile_card_parts_info: member.profileCardPartsInfo,
		profile_icon_parts_info: member.profileIconPartsInfo,
		is_mute_player: member.isMutePlayer,
		is_voice_chat_ban: member.isVoiceChatBan,
		last_login_date_time: member.lastLoginDateTime,
	};
}

function createCircleMember(
	source: CircleProfilePartsSource,
	user: RegisteredUserState,
	positionType: number,
): CircleMemberResponse {
	return {
		player_id: user.playerId,
		player_name: user.playerName,
		player_level: user.playerLevel,
		user_type: 2,
		position_type: positionType,
		profile_card_parts_info: createProfileCardPartsInfo(source, user.playerId),
		profile_icon_parts_info: createProfileIconPartsInfo(source, user.playerId),
		is_mute_player: false,
		is_voice_chat_ban: false,
		last_login_date_time: user.lastLoginDate,
	};
}

export function createEmptyCircleRankingInfo(): CircleRankingInfoResponse {
	return { name: '', rank: 0, month: 0, point: 0, member_ranking_list: null };
}

export function createEmptyCircleInfo(): CircleInfoResponse {
	return {
		circle_invitations_id: '',
		circle_ranking_info: createEmptyCircleRankingInfo(),
		d_chat_rooms_id: '',
		d_guild_invitations_id: '',
		feslive_rank_message: '',
		guild_comment: '',
		guild_icon_parts_info: '',
		guild_id: '',
		guild_member_num: 0,
		guild_name: '',
		guild_policy_action: 0,
		guild_policy_recruiting: 0,
		guild_rank: 0,
		is_join_guild_ranking: false,
		leader_player_id: '',
		search_guild_key: '',
	};
}

export function createCircleInfoForPlayer(
	circle: CircleState | null,
	playerId: string,
): CircleInfoResponse {
	return circle !== null && isCircleMember(circle, playerId)
		? createCircleInfo(circle, createEmptyCircleRankingInfo())
		: createEmptyCircleInfo();
}
