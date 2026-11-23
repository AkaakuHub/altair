import type { ServerState } from '../server-state-schema.ts';

export function removeCircleReferencesForUser(
	state: ServerState,
	playerId: string,
): void {
	const circle = state.circle;
	if (!circle) return;
	circle.members = circle.members.filter(
		(member) => member.playerId !== playerId,
	);
	circle.joinRequests = circle.joinRequests.filter(
		(request) => request.playerId !== playerId,
	);
	circle.chatLogs = circle.chatLogs.filter((log) => log.playerId !== playerId);
	if (circle.members.length === 0) {
		state.circle = null;
		return;
	}
	if (circle.leaderPlayerId === playerId) {
		const nextLeader = circle.members[0];
		if (!nextLeader) {
			state.circle = null;
			return;
		}
		nextLeader.positionType = 1;
		circle.leaderPlayerId = nextLeader.playerId;
	}
}

export function renameCircleReferencesForUser(
	state: ServerState,
	currentPlayerId: string,
	nextPlayerId: string,
): void {
	const circle = state.circle;
	if (!circle) return;
	if (circle.leaderPlayerId === currentPlayerId)
		circle.leaderPlayerId = nextPlayerId;
	circle.members = circle.members.map((member) =>
		member.playerId === currentPlayerId
			? { ...member, playerId: nextPlayerId }
			: member,
	);
	circle.joinRequests = circle.joinRequests.map((request) =>
		request.playerId === currentPlayerId
			? { ...request, playerId: nextPlayerId }
			: request,
	);
	circle.chatLogs = circle.chatLogs.map((chatLog) =>
		chatLog.playerId === currentPlayerId
			? { ...chatLog, playerId: nextPlayerId }
			: chatLog,
	);
}
