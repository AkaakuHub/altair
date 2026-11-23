import type { ServerState } from '../server-state-schema.ts';
import { ensureCircleState } from './circle-aggregate-state.ts';
import { addCircleMemberWithJoinLog } from './circle-member-state.ts';
import type { CircleState } from './circle-types.ts';

export function addCircleJoinRequest(
	state: ServerState,
	playerId: string,
	guildInvitationId: string,
	createTime: string,
): boolean {
	const circle = ensureCircleState(state);
	if (
		!circle ||
		guildInvitationId.trim().length === 0 ||
		createTime.trim().length === 0 ||
		!state.registeredUsers.some((user) => user.playerId === playerId)
	)
		return false;
	const request = {
		guildInvitationId: guildInvitationId.trim(),
		playerId,
		createTime: createTime.trim(),
	};
	const existingIndex = circle.joinRequests.findIndex(
		(joinRequest) =>
			joinRequest.guildInvitationId === request.guildInvitationId,
	);
	if (existingIndex >= 0) {
		circle.joinRequests = circle.joinRequests.map((joinRequest, index) =>
			index === existingIndex ? request : joinRequest,
		);
		return true;
	}
	circle.joinRequests = [...circle.joinRequests, request];
	return true;
}

export function requestCircleJoin(
	state: ServerState,
	playerId: string,
	searchGuildKey: string,
	createTime: string,
): string {
	const circle = ensureCircleState(state);
	if (
		!circle ||
		circle.searchGuildKey !== searchGuildKey ||
		circle.members.some((member) => member.playerId === playerId)
	)
		return '';
	if (circle.guildPolicyRecruiting === 1) {
		circle.joinRequests = circle.joinRequests.filter(
			(request) => request.playerId !== playerId,
		);
		addCircleMemberWithJoinLog(state, circle, playerId);
		return '';
	}
	const existing = circle.joinRequests.find(
		(request) => request.playerId === playerId,
	);
	if (existing) return existing.guildInvitationId;
	const invitationId = crypto.randomUUID();
	addCircleJoinRequest(state, playerId, invitationId, createTime);
	return invitationId;
}

export function findCircleJoinRequestIdByPlayer(
	circle: CircleState,
	playerId: string,
): string {
	return (
		circle.joinRequests.find((request) => request.playerId === playerId)
			?.guildInvitationId ?? ''
	);
}

export function hasPendingCircleJoinRequestForLeader(
	circle: CircleState | null,
	playerId: string,
): boolean {
	return circle?.leaderPlayerId === playerId && circle.joinRequests.length > 0;
}

export function hasPendingCircleJoinRequestFromPlayer(
	circle: CircleState | null,
	playerId: string,
): boolean {
	return (
		circle?.joinRequests.some((request) => request.playerId === playerId) ??
		false
	);
}

export function removeCircleJoinRequest(
	state: ServerState,
	guildInvitationId: string,
): boolean {
	const circle = ensureCircleState(state);
	if (!circle) return false;
	circle.joinRequests = circle.joinRequests.filter(
		(request) => request.guildInvitationId !== guildInvitationId,
	);
	return true;
}

export function approveCircleJoinRequest(
	state: ServerState,
	guildInvitationId: string,
): boolean {
	const circle = ensureCircleState(state);
	if (!circle) return false;
	const request = circle.joinRequests.find(
		(current) => current.guildInvitationId === guildInvitationId,
	);
	if (!request) return true;
	circle.joinRequests = circle.joinRequests.filter(
		(current) => current.guildInvitationId !== guildInvitationId,
	);
	addCircleMemberWithJoinLog(state, circle, request.playerId);
	return true;
}

export function rejectCircleJoinRequest(
	state: ServerState,
	guildInvitationId: string,
): boolean {
	return removeCircleJoinRequest(state, guildInvitationId);
}
