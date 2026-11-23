import type { UserOwnedMasterSupport } from '../../application/user-owned-master-projection.ts';
import type { UserStatusController } from '../../application/user-status-controller.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { hasFollow } from '../../state/follow-state.ts';
import { hasMutedPlayer } from '../../state/user-social-aggregate.ts';
import type {
	FollowerListResponse,
	FollowListResponse,
	FollowRecommendListResponse,
} from '../response-types/follow-response-types.ts';
import {
	canCreateFollowInfo,
	createFollowInfo,
} from './follow-profile-info-response.ts';
import type {
	FollowDirectoryState,
	FollowResponseSource,
} from './follow-response-source.ts';

type MasterSupport = Pick<
	UserOwnedMasterSupport,
	'getCardFingerprint' | 'hasCard'
>;

export function createFollowListResponse(
	state: FollowResponseSource,
	playerId: string,
	userStatus: UserStatusController,
	masterSupport: MasterSupport,
): FollowListResponse {
	const requestUser = findUser(state, playerId);
	if (!requestUser)
		throw new Error(`follow source user not found: ${playerId}`);
	return {
		follow_info_list: findFollowedUsers(state, requestUser.playerId).map(
			(user) =>
				createFollowInfo(
					state,
					requestUser.playerId,
					user.playerId,
					userStatus,
					masterSupport,
				),
		),
		max_follow_count: 30,
	};
}

export function createFollowerListResponse(
	state: FollowResponseSource,
	playerId: string,
	userStatus: UserStatusController,
	masterSupport: MasterSupport,
): FollowerListResponse {
	const requestUser = findUser(state, playerId);
	if (!requestUser)
		throw new Error(`follow target user not found: ${playerId}`);
	return {
		follower_info_list: findFollowerUsers(state, requestUser.playerId)
			.filter(
				(user) => !hasMutedPlayer(state, requestUser.playerId, user.playerId),
			)
			.filter((user) =>
				canCreateFollowInfo(state, requestUser.playerId, user.playerId),
			)
			.map((user) =>
				createFollowInfo(
					state,
					requestUser.playerId,
					user.playerId,
					userStatus,
					masterSupport,
				),
			),
		max_follower_count: 50,
	};
}

export function createFollowRecommendListResponse(
	state: FollowResponseSource,
	playerId: string,
	userStatus: UserStatusController,
	masterSupport: MasterSupport,
): FollowRecommendListResponse {
	const requestUser = findUser(state, playerId);
	if (!requestUser) {
		throw new Error(`follow recommend source user not found: ${playerId}`);
	}
	const recommendInfoList = state.registeredUsers
		.filter((user) => user.playerId !== requestUser.playerId)
		.filter((user) => !hasFollow(state, requestUser.playerId, user.playerId))
		.filter(
			(user) => !hasMutedPlayer(state, requestUser.playerId, user.playerId),
		)
		.filter((user) =>
			canCreateFollowInfo(state, requestUser.playerId, user.playerId),
		)
		.map((user) =>
			createFollowInfo(
				state,
				requestUser.playerId,
				user.playerId,
				userStatus,
				masterSupport,
			),
		);
	return {
		max_recommend_count: recommendInfoList.length,
		recommend_info_list: recommendInfoList,
	};
}

function findFollowedUsers(
	state: FollowDirectoryState,
	playerId: string,
): RegisteredUserState[] {
	return state.followRelations
		.filter((relation) => relation.playerId === playerId)
		.filter(
			(relation) => !hasMutedPlayer(state, playerId, relation.targetPlayerId),
		)
		.map((relation) => findRequiredUser(state, relation.targetPlayerId));
}

function findFollowerUsers(
	state: FollowDirectoryState,
	playerId: string,
): RegisteredUserState[] {
	return state.followRelations
		.filter((relation) => relation.targetPlayerId === playerId)
		.map((relation) => findRequiredUser(state, relation.playerId));
}

function findRequiredUser(
	state: Pick<FollowResponseSource, 'registeredUsers'>,
	playerId: string,
): RegisteredUserState {
	const user = state.registeredUsers.find(
		(entry) => entry.playerId === playerId,
	);
	if (!user) throw new Error(`registered user not found: ${playerId}`);
	return user;
}

function findUser(
	state: Pick<FollowResponseSource, 'registeredUsers'>,
	playerId: string,
): RegisteredUserState | undefined {
	return state.registeredUsers.find((entry) => entry.playerId === playerId);
}
