import type { ServerState } from '../server-state-schema.ts';
import { ensureCircleState } from './circle-aggregate-state.ts';
import { appendCircleSystemChatLog } from './circle-chat-state.ts';
import type { CircleState } from './circle-types.ts';

export function addCircleMember(
	state: Pick<ServerState, 'circle' | 'registeredUsers'>,
	playerId: string,
	positionType: number,
): boolean {
	const circle = ensureCircleState(state);
	if (
		!circle ||
		!state.registeredUsers.some((user) => user.playerId === playerId)
	)
		return false;
	const existing = circle.members.find(
		(member) => member.playerId === playerId,
	);
	if (existing) {
		existing.positionType = positionType;
		return true;
	}
	circle.members = [...circle.members, { playerId, positionType }];
	return true;
}

export function isCircleMember(
	circle: CircleState | null,
	playerId: string,
): boolean {
	return (
		circle?.members.some((member) => member.playerId === playerId) ?? false
	);
}

export function findPlayerCircleId(
	circle: CircleState | null,
	playerId: string,
): string | null {
	return circle !== null && isCircleMember(circle, playerId)
		? circle.guildId
		: null;
}

export function isCircleLeader(
	circle: CircleState | null,
	playerId: string,
): boolean {
	return circle?.leaderPlayerId === playerId;
}

export function changeCircleMemberPosition(
	state: ServerState,
	playerId: string,
	positionType: number,
): boolean {
	const circle = ensureCircleState(state);
	const member = circle?.members.find(
		(current) => current.playerId === playerId,
	);
	if (!circle || !member) return false;
	member.positionType = positionType;
	if (positionType === 2) {
		const user = state.registeredUsers.find(
			(registeredUser) => registeredUser.playerId === playerId,
		);
		if (user)
			appendCircleSystemChatLog(
				circle,
				16,
				`${user.playerName}がサークルのサブリーダーになりました`,
			);
	}
	return true;
}

export function dismissCircleSubLeader(
	state: ServerState,
	playerId: string,
): boolean {
	const member = ensureCircleState(state)?.members.find(
		(current) => current.playerId === playerId,
	);
	if (!member) return false;
	member.positionType = 0;
	return true;
}

export function removeCircleMember(
	state: ServerState,
	playerId: string,
): boolean {
	const circle = ensureCircleState(state);
	if (!circle) return false;
	circle.members = circle.members.filter(
		(member) => member.playerId !== playerId,
	);
	if (circle.members.length === 0) {
		state.circle = null;
		return true;
	}
	if (circle.leaderPlayerId === playerId) {
		const nextLeader = circle.members[0];
		if (!nextLeader) {
			state.circle = null;
			return true;
		}
		nextLeader.positionType = 1;
		circle.leaderPlayerId = nextLeader.playerId;
	}
	return true;
}

export function expelCircleMember(
	state: ServerState,
	playerId: string,
): boolean {
	const circle = ensureCircleState(state);
	if (!circle) return false;
	const user = state.registeredUsers.find(
		(registeredUser) => registeredUser.playerId === playerId,
	);
	const removed = removeCircleMember(state, playerId);
	const updatedCircle = ensureCircleState(state);
	if (removed && updatedCircle && user)
		appendCircleSystemChatLog(
			updatedCircle,
			14,
			`${user.playerName}がサークルから脱退しました`,
		);
	return removed;
}

export function transferCircleLeader(
	state: Pick<ServerState, 'circle' | 'registeredUsers'>,
	playerId: string,
): boolean {
	const circle = ensureCircleState(state);
	const nextLeader = circle?.members.find(
		(member) => member.playerId === playerId,
	);
	if (!circle || !nextLeader) return false;
	for (const member of circle.members)
		member.positionType = member.playerId === playerId ? 1 : 0;
	circle.members = [
		nextLeader,
		...circle.members.filter((member) => member.playerId !== playerId),
	];
	circle.leaderPlayerId = playerId;
	const user = state.registeredUsers.find(
		(registeredUser) => registeredUser.playerId === playerId,
	);
	if (user)
		appendCircleSystemChatLog(
			circle,
			15,
			`${user.playerName}がサークルのリーダーになりました`,
		);
	return true;
}

export function addCircleMemberWithJoinLog(
	state: ServerState,
	circle: CircleState,
	playerId: string,
): void {
	if (!circle.members.some((member) => member.playerId === playerId))
		circle.members = [...circle.members, { playerId, positionType: 0 }];
	const user = state.registeredUsers.find(
		(registeredUser) => registeredUser.playerId === playerId,
	);
	if (user)
		appendCircleSystemChatLog(
			circle,
			13,
			`${user.playerName}がサークルに加入しました`,
		);
}
