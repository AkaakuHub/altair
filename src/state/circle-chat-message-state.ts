import type { RegisteredUserState } from '../server-state-schema.ts';
import { appendCircleChatLog } from './circle-chat-state.ts';
import type { CircleState } from './circle-types.ts';
import { isRecord } from './json-state-utils.ts';

export function appendCircleChatMessage(
	body: unknown,
	circle: CircleState | null,
	user: RegisteredUserState,
	createTime: string,
): string {
	const comment = readCircleChatComment(body);
	if (circle && comment.length > 0)
		appendCircleChatLog(circle, user.playerId, comment, createTime);
	return comment;
}

function readCircleChatComment(body: unknown): string {
	if (!isRecord(body) || typeof body.guild_chat_info !== 'string') return '';
	const guildChatInfo = JSON.parse(body.guild_chat_info) as unknown;
	return isRecord(guildChatInfo) &&
		typeof guildChatInfo.chat_comment === 'string'
		? guildChatInfo.chat_comment
		: '';
}
