import { randomUUID } from 'node:crypto';
import type { UserStatusController } from '../../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import type {
	CircleChatLogState,
	CircleJoinRequestState,
	CircleMemberState,
	CircleState,
} from '../../../../../../src/state/circle-types.ts';
import {
	type JsonRecord,
	readBoolean,
	readNumber,
	readRecord,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';
import { upsertOfficialDataMigrationCircleCommenter } from './official-data-migration-circle-commenter.ts';

export function createCircleFromResponse(
	state: ServerState,
	response: JsonRecord | undefined,
	chatLogResponse: JsonRecord | undefined,
	inviteAndJoinResponse: JsonRecord | undefined,
	userStatus: UserStatusController,
): CircleState | null {
	if (response === undefined) {
		return null;
	}
	const circleInfo = readRecord(response.circle_info);
	if (circleInfo === null) {
		return null;
	}
	const searchGuildKey = readString(circleInfo.search_guild_key);
	const guildId = readString(circleInfo.guild_id);
	if (searchGuildKey === null || guildId === null) {
		return null;
	}
	const members = readRecordArray(response.circle_member_list)
		.map(createCircleMemberState)
		.filter((member): member is CircleMemberState => member !== null);
	for (const commenter of readRecordArray(
		chatLogResponse?.commenter_info_list,
	)) {
		upsertOfficialDataMigrationCircleCommenter(state, commenter, userStatus);
	}
	return {
		searchGuildKey,
		guildId,
		chatRoomId: readString(circleInfo.d_chat_rooms_id) ?? randomUUID(),
		guildName: readString(circleInfo.guild_name) ?? searchGuildKey,
		leaderPlayerId:
			readString(circleInfo.leader_player_id) ?? members[0]?.playerId ?? '',
		guildRank: readNumber(circleInfo.guild_rank) ?? 1,
		guildPolicyAction: readNumber(circleInfo.guild_policy_action) ?? 1,
		guildPolicyRecruiting: readNumber(circleInfo.guild_policy_recruiting) ?? 1,
		guildComment: readString(circleInfo.guild_comment) ?? '',
		guildIconPartsInfo: readString(circleInfo.guild_icon_parts_info) ?? '',
		members,
		chatLogs: readRecordArray(chatLogResponse?.circle_chat_log_list)
			.map(createCircleChatLog)
			.filter((log): log is CircleChatLogState => log !== null),
		joinRequests: readRecordArray(inviteAndJoinResponse?.join_info_list)
			.map(createCircleJoinRequest)
			.filter((request): request is CircleJoinRequestState => request !== null),
	};
}

function createCircleChatLog(log: JsonRecord): CircleChatLogState | null {
	const chatDataId = readString(log.d_chat_datas_id);
	const chatType = readNumber(log.chat_type);
	const playerId = readString(log.player_id);
	const orderId = readNumber(log.order_id);
	if (
		chatDataId === null ||
		chatType === null ||
		playerId === null ||
		orderId === null
	) {
		return null;
	}
	return {
		chatDataId,
		chatType,
		playerId,
		comment: readString(log.comment) ?? '',
		orderId,
		createTime: typeof log.create_time === 'string' ? log.create_time : null,
	};
}

function createCircleJoinRequest(
	request: JsonRecord,
): CircleJoinRequestState | null {
	const guildInvitationId = readString(request.d_guild_invitations_id);
	const playerId = readString(request.player_id);
	const createTime = readString(request.create_time);
	if (guildInvitationId === null || playerId === null || createTime === null) {
		return null;
	}
	return { guildInvitationId, playerId, createTime };
}

function createCircleMemberState(member: JsonRecord): CircleMemberState | null {
	const playerId = readString(member.player_id);
	if (playerId === null) {
		return null;
	}
	const circleMember: CircleMemberState = {
		playerId,
		positionType: readNumber(member.position_type) ?? 2,
	};
	const playerName = readString(member.player_name);
	if (playerName !== null) {
		circleMember.playerName = playerName;
	}
	const playerLevel = readNumber(member.player_level);
	if (playerLevel !== null) {
		circleMember.playerLevel = playerLevel;
	}
	const userType = readNumber(member.user_type);
	if (userType !== null) {
		circleMember.userType = userType;
	}
	const profileCardPartsInfo = readString(member.profile_card_parts_info);
	if (profileCardPartsInfo !== null) {
		circleMember.profileCardPartsInfo = profileCardPartsInfo;
	}
	const profileIconPartsInfo = readString(member.profile_icon_parts_info);
	if (profileIconPartsInfo !== null) {
		circleMember.profileIconPartsInfo = profileIconPartsInfo;
	}
	const isMutePlayer = readBoolean(member.is_mute_player);
	if (isMutePlayer !== null) {
		circleMember.isMutePlayer = isMutePlayer;
	}
	const isVoiceChatBan = readBoolean(member.is_voice_chat_ban);
	if (isVoiceChatBan !== null) {
		circleMember.isVoiceChatBan = isVoiceChatBan;
	}
	const lastLoginDateTime = readString(member.last_login_date_time);
	if (lastLoginDateTime !== null) {
		circleMember.lastLoginDateTime = lastLoginDateTime;
	}
	return circleMember;
}
