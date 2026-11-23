import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import { appendCircleSystemChatLog } from './circle-chat-state.ts';
import {
	addCircleMember,
	transferCircleLeader,
} from './circle-member-state.ts';
import { markCircleDissolutionNotification } from './circle-notification-state.ts';
import type {
	CircleCreateApiInput,
	CircleCreateInput,
	CircleSettingApiInput,
	CircleState,
} from './circle-types.ts';

export function ensureCircleState(
	state: Pick<ServerState, 'circle'>,
): CircleState | null {
	return state.circle;
}

export function setCircleState(
	state: Pick<ServerState, 'circle' | 'registeredUsers'>,
	leader: RegisteredUserState,
	input: CircleCreateInput,
): boolean {
	if (
		input.guildName.trim().length === 0 ||
		input.guildComment.trim().length === 0
	)
		return false;
	const searchGuildKey =
		input.searchGuildKey.trim() || createRandomSearchGuildKey();
	const settings = {
		...input,
		searchGuildKey,
		guildName: input.guildName.trim(),
		guildComment: input.guildComment.trim(),
	};
	const circle = state.circle;
	if (circle !== null) {
		if (circle.leaderPlayerId !== leader.playerId) {
			if (
				!circle.members.some((member) => member.playerId === leader.playerId) &&
				!addCircleMember(state, leader.playerId, 0)
			)
				return false;
			if (!transferCircleLeader(state, leader.playerId)) return false;
		}
		Object.assign(circle, settings);
		return true;
	}
	state.circle = createCircle(leader, settings);
	appendCircleSystemChatLog(
		state.circle,
		11,
		`${leader.playerName}がサークルを設立しました`,
	);
	return true;
}

export function createCircleStateFromApiInput(
	state: ServerState,
	leader: RegisteredUserState,
	input: CircleCreateApiInput,
): CircleState {
	const circle = createCircle(leader, {
		...input,
		searchGuildKey: createRandomSearchGuildKey(),
	});
	state.circle = circle;
	appendCircleSystemChatLog(
		circle,
		11,
		`${leader.playerName}がサークルを設立しました`,
	);
	return circle;
}

export function deleteCircleState(state: ServerState): void {
	state.circle = null;
}

export function dissolveCircleState(
	state: ServerState,
	dissolvedByPlayerId: string,
): boolean {
	const circle = ensureCircleState(state);
	if (!circle) return false;
	markCircleDissolutionNotification(
		state,
		circle.members
			.map((member) => member.playerId)
			.filter((playerId) => playerId !== dissolvedByPlayerId),
	);
	deleteCircleState(state);
	return true;
}

export function updateCircleStateFromApiInput(
	state: ServerState,
	input: CircleSettingApiInput,
): boolean {
	const circle = ensureCircleState(state);
	if (!circle || circle.searchGuildKey !== input.searchGuildKey) return false;
	circle.guildName = input.guildName;
	circle.guildComment = input.guildComment;
	circle.guildPolicyAction = input.guildPolicyAction;
	circle.guildPolicyRecruiting = input.guildPolicyRecruiting;
	circle.guildIconPartsInfo = input.guildIconPartsInfo;
	return true;
}

function createCircle(
	leader: RegisteredUserState,
	input: CircleCreateInput,
): CircleState {
	return {
		searchGuildKey: input.searchGuildKey,
		guildId: crypto.randomUUID(),
		chatRoomId: crypto.randomUUID(),
		guildName: input.guildName,
		leaderPlayerId: leader.playerId,
		guildRank: 1,
		guildPolicyAction: input.guildPolicyAction,
		guildPolicyRecruiting: input.guildPolicyRecruiting,
		guildComment: input.guildComment,
		guildIconPartsInfo: input.guildIconPartsInfo,
		members: [{ playerId: leader.playerId, positionType: 1 }],
		chatLogs: [],
		joinRequests: [],
	};
}

function createRandomSearchGuildKey(): string {
	return crypto.randomUUID().replaceAll('-', '').toUpperCase().slice(0, 9);
}
