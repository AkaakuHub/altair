import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import { isRecord } from './json-state-utils.ts';

export type OfficialFollowInfoState = {
	comment: string;
	fanLevel: number;
	friendCardInfo: unknown[];
	lastLoginDateTime: string | null;
	name: string;
	profileIconPartsInfo: string;
};

export type FollowRelationState = {
	playerId: string;
	targetPlayerId: string;
	officialInfo?: OfficialFollowInfoState;
};

export type FollowMutationSource = Pick<
	ServerState,
	'followRelations' | 'registeredUsers'
>;

const FOLLOW_TYPE_FOLLOW = 1;
const FOLLOW_TYPE_UNFOLLOW = 2;

export function addFollowRelation(
	state: FollowMutationSource,
	playerId: string,
	targetPlayerId: string,
): boolean {
	return setFollowRelation(state, playerId, targetPlayerId, FOLLOW_TYPE_FOLLOW);
}

export function setFollowRelation(
	state: FollowMutationSource,
	playerId: string,
	targetPlayerId: string,
	followType: number,
): boolean {
	if (playerId === targetPlayerId) {
		return false;
	}
	const player = findUser(state, playerId);
	const target = findUser(state, targetPlayerId);
	if (!player || !target) {
		return false;
	}
	if (followType === FOLLOW_TYPE_FOLLOW) {
		addFollowRelationState(state, player.playerId, target.playerId);
		return true;
	}
	if (followType === FOLLOW_TYPE_UNFOLLOW) {
		removeFollowRelationState(state, player.playerId, target.playerId);
		return true;
	}
	return false;
}

function addFollowRelationState(
	state: FollowMutationSource,
	playerId: string,
	targetPlayerId: string,
): void {
	const exists = state.followRelations.some(
		(relation) =>
			relation.playerId === playerId &&
			relation.targetPlayerId === targetPlayerId,
	);
	if (exists) {
		return;
	}
	state.followRelations.push({
		playerId,
		targetPlayerId,
	});
}

function removeFollowRelationState(
	state: FollowMutationSource,
	playerId: string,
	targetPlayerId: string,
): void {
	const relationIndex = state.followRelations.findIndex(
		(relation) =>
			relation.playerId === playerId &&
			relation.targetPlayerId === targetPlayerId,
	);
	if (relationIndex !== -1) {
		state.followRelations.splice(relationIndex, 1);
	}
}

export function isFollowRelationState(
	value: unknown,
): value is FollowRelationState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		typeof value.targetPlayerId === 'string' &&
		(value.officialInfo === undefined ||
			isOfficialFollowInfoState(value.officialInfo))
	);
}

function isOfficialFollowInfoState(
	value: unknown,
): value is OfficialFollowInfoState {
	return (
		isRecord(value) &&
		typeof value.comment === 'string' &&
		typeof value.fanLevel === 'number' &&
		Array.isArray(value.friendCardInfo) &&
		(value.lastLoginDateTime === null ||
			typeof value.lastLoginDateTime === 'string') &&
		typeof value.name === 'string' &&
		typeof value.profileIconPartsInfo === 'string'
	);
}

export function hasFollow(
	state: Pick<ServerState, 'followRelations'>,
	playerId: string,
	targetPlayerId: string,
): boolean {
	return state.followRelations.some(
		(relation) =>
			relation.playerId === playerId &&
			relation.targetPlayerId === targetPlayerId,
	);
}

function findUser(
	state: Pick<ServerState, 'registeredUsers'>,
	playerId: string,
): RegisteredUserState | undefined {
	return state.registeredUsers.find((user) => user.playerId === playerId);
}
