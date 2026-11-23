import type { CircleChatLogState, CircleState } from './circle-types.ts';

export function getLatestCircleChatOrderId(circle: CircleState | null): number {
	return (
		circle?.chatLogs.reduce(
			(maximum, log) => Math.max(maximum, log.orderId),
			0,
		) ?? 0
	);
}

export function appendCircleChatLog(
	circle: CircleState,
	playerId: string,
	comment: string,
	createTime: string,
): CircleChatLogState {
	const log = {
		chatDataId: crypto.randomUUID(),
		chatType: 1,
		playerId,
		comment,
		orderId: getLatestCircleChatOrderId(circle) + 1,
		createTime,
	};
	circle.chatLogs = [log, ...circle.chatLogs];
	return log;
}

export function appendCircleSystemChatLog(
	circle: CircleState,
	chatType: number,
	comment: string,
): CircleChatLogState {
	const log = {
		chatDataId: '',
		chatType,
		playerId: '',
		comment,
		orderId: getLatestCircleChatOrderId(circle) + 1,
		createTime: null,
	};
	circle.chatLogs = [log, ...circle.chatLogs];
	return log;
}
