import { getLatestCircleChatOrderId } from '../../state/circle-chat-state.ts';
import type {
	CircleChatLogState,
	CircleState,
} from '../../state/circle-types.ts';
import type {
	CircleChatLogListResponse,
	CircleChatLogResponse,
	CircleCommenterResponse,
	CircleSetChatMessageResponse,
} from '../response-types/circle-response-types.ts';
import type { CircleChatLogSource } from './circle-response-common.ts';
import { createProfileIconPartsInfo } from './profile-icon-parts-response.ts';

export type CircleChatLogListConditions = { diffOrderId: number | null };

export function createCircleChatLogListResponse(
	circle: CircleState | null,
	source: CircleChatLogSource,
	conditions: CircleChatLogListConditions = { diffOrderId: null },
): CircleChatLogListResponse {
	const chatLogs = selectCircleChatLogs(circle, conditions);
	return {
		circle_chat_log_list: chatLogs.map(createCircleChatLogResponse),
		commenter_info_list: createCircleCommenters(chatLogs, source),
		latest_chat_order_id:
			conditions.diffOrderId ?? getLatestCircleChatOrderId(circle),
		polling_interval: 5000,
	};
}

export function createCircleSetChatMessageResponse(
	comment: string,
): CircleSetChatMessageResponse {
	return { chat_comment: comment };
}

function createCircleChatLogResponse(
	log: CircleChatLogState,
): CircleChatLogResponse {
	return {
		d_chat_datas_id: log.chatDataId,
		chat_type: log.chatType,
		player_id: log.playerId,
		comment: log.comment,
		order_id: log.orderId,
		create_time: log.createTime,
	};
}

export function selectCircleChatLogs(
	circle: CircleState | null,
	conditions: CircleChatLogListConditions,
): CircleChatLogState[] {
	if (!circle) {
		return [];
	}
	const diffOrderId = conditions.diffOrderId;
	return diffOrderId === null
		? circle.chatLogs
		: circle.chatLogs.filter((log) => log.orderId > diffOrderId);
}

function createCircleCommenters(
	logs: CircleChatLogState[],
	source: CircleChatLogSource,
): CircleCommenterResponse[] {
	const playerIds = new Set<string>();
	for (const log of logs) {
		if (log.playerId.length > 0) {
			playerIds.add(log.playerId);
		}
	}
	return [...playerIds].flatMap((playerId) => {
		const user = source.registeredUsers.find(
			(registeredUser) => registeredUser.playerId === playerId,
		);
		return user
			? [
					{
						player_id: user.playerId,
						player_name: user.playerName,
						profile_icon_parts_info: createProfileIconPartsInfo(
							source,
							user.playerId,
						),
						user_type: 2,
						is_mute_player: false,
					},
				]
			: [];
	});
}
