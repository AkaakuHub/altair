import type {
	CircleChatLogState,
	CircleJoinRequestState,
	CircleMemberState,
	CircleState,
} from './circle-types.ts';
import { isArrayOf, isRecord } from './json-state-utils.ts';

export function isCircleState(value: unknown): value is CircleState {
	return (
		isRecord(value) &&
		typeof value.searchGuildKey === 'string' &&
		typeof value.guildId === 'string' &&
		typeof value.chatRoomId === 'string' &&
		typeof value.guildName === 'string' &&
		typeof value.leaderPlayerId === 'string' &&
		typeof value.guildRank === 'number' &&
		typeof value.guildPolicyAction === 'number' &&
		typeof value.guildPolicyRecruiting === 'number' &&
		typeof value.guildComment === 'string' &&
		typeof value.guildIconPartsInfo === 'string' &&
		isArrayOf(value.members, isCircleMemberState) &&
		isArrayOf(value.chatLogs, isCircleChatLogState) &&
		isArrayOf(value.joinRequests, isCircleJoinRequestState)
	);
}

function isCircleMemberState(value: unknown): value is CircleMemberState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		typeof value.positionType === 'number' &&
		(value.playerName === undefined || typeof value.playerName === 'string') &&
		(value.playerLevel === undefined ||
			typeof value.playerLevel === 'number') &&
		(value.userType === undefined || typeof value.userType === 'number') &&
		(value.profileCardPartsInfo === undefined ||
			typeof value.profileCardPartsInfo === 'string') &&
		(value.profileIconPartsInfo === undefined ||
			typeof value.profileIconPartsInfo === 'string') &&
		(value.isMutePlayer === undefined ||
			typeof value.isMutePlayer === 'boolean') &&
		(value.isVoiceChatBan === undefined ||
			typeof value.isVoiceChatBan === 'boolean') &&
		(value.lastLoginDateTime === undefined ||
			typeof value.lastLoginDateTime === 'string')
	);
}

function isCircleChatLogState(value: unknown): value is CircleChatLogState {
	return (
		isRecord(value) &&
		typeof value.chatDataId === 'string' &&
		typeof value.chatType === 'number' &&
		typeof value.playerId === 'string' &&
		typeof value.comment === 'string' &&
		typeof value.orderId === 'number' &&
		(typeof value.createTime === 'string' || value.createTime === null)
	);
}

function isCircleJoinRequestState(
	value: unknown,
): value is CircleJoinRequestState {
	return (
		isRecord(value) &&
		typeof value.guildInvitationId === 'string' &&
		typeof value.playerId === 'string' &&
		typeof value.createTime === 'string'
	);
}
