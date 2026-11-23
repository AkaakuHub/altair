import { projectFriendCardInfo } from '../../application/friend-card-projection.ts';
import type { UserOwnedMasterSupport } from '../../application/user-owned-master-projection.ts';
import type { UserStatusController } from '../../application/user-status-controller.ts';
import type { ServerState } from '../../server-state-schema.ts';
import { calculateFanLevel } from '../../state/fan-level-calculation.ts';
import {
	hasFollow,
	type OfficialFollowInfoState,
} from '../../state/follow-state.ts';
import { createFriendCardInfo } from '../../state/friend-card-profile-projection.ts';
import type { ProfileFriendCardInfo } from '../../state/friend-card-types.ts';
import { isRecord } from '../../state/json-state-utils.ts';
import { findUserProfileSettings } from '../../state/profile-settings-state.ts';
import { findUserCards } from '../../state/user-card-aggregate-state.ts';
import { isUserCardDataState } from '../../state/user-card-validator.ts';
import type {
	FollowInfoResponse,
	FriendCardInfoEntryResponse,
	FriendCardInfoResponse,
} from '../response-types/follow-response-types.ts';
import type { FollowResponseSource } from './follow-response-source.ts';
import { createProfileIconPartsInfo } from './profile-icon-parts-response.ts';
import { createOfficialUserCardData } from './user-card-response.ts';

const DEFAULT_PROFILE_COMMENT = 'よろしくお願いします！';

export function createFollowInfo(
	state: FollowResponseSource,
	requestPlayerId: string,
	targetPlayerId: string,
	userStatus: UserStatusController,
	masterSupport: Pick<UserOwnedMasterSupport, 'getCardFingerprint' | 'hasCard'>,
): FollowInfoResponse {
	const officialInfo = findOfficialFollowInfo(
		state,
		requestPlayerId,
		targetPlayerId,
	);
	if (officialInfo !== undefined) {
		const response = createOfficialFollowInfoResponse(
			state,
			requestPlayerId,
			targetPlayerId,
			officialInfo,
		);
		return {
			...response,
			friend_card_info: projectFriendCardInfo(
				response.friend_card_info,
				masterSupport,
			),
		};
	}
	const target = findRequiredUser(state, targetPlayerId);
	const targetStatus = userStatus.ensure(state, target.playerId).value;
	const targetCards = findUserCards(state, target.playerId);
	const targetProfileSettings = findUserProfileSettings(state, target.playerId);
	const friendCardInfo =
		targetCards === undefined
			? []
			: createFriendCardInfo(state, targetCards, target.playerId);
	return {
		comment: targetProfileSettings?.comment ?? DEFAULT_PROFILE_COMMENT,
		fan_level: calculateFanLevel(userStatus.getMemberFanLevels(targetStatus)),
		follow_status: hasFollow(state, requestPlayerId, target.playerId) ? 1 : 0,
		follower_status: hasFollow(state, target.playerId, requestPlayerId) ? 1 : 0,
		friend_card_info: projectFriendCardInfo(friendCardInfo, masterSupport),
		last_login_date_time: target.lastLoginDate,
		name: target.playerName,
		player_id: target.playerId,
		profile_icon_parts_info: createProfileIconPartsInfo(state, target.playerId),
	};
}

export function canCreateFollowInfo(
	state: FollowResponseSource,
	requestPlayerId: string,
	targetPlayerId: string,
): boolean {
	if (
		findOfficialFollowInfo(state, requestPlayerId, targetPlayerId) !== undefined
	) {
		return true;
	}
	return state.userProfileDesigns.some(
		(profileDesign) => profileDesign.playerId === targetPlayerId,
	);
}

function findOfficialFollowInfo(
	state: Pick<ServerState, 'followRelations'>,
	requestPlayerId: string,
	targetPlayerId: string,
): OfficialFollowInfoState | undefined {
	return (
		state.followRelations.find(
			(relation) =>
				relation.playerId === requestPlayerId &&
				relation.targetPlayerId === targetPlayerId,
		)?.officialInfo ??
		state.followRelations.find(
			(relation) =>
				relation.playerId === targetPlayerId &&
				relation.targetPlayerId === requestPlayerId,
		)?.officialInfo
	);
}

function createOfficialFollowInfoResponse(
	state: Pick<ServerState, 'followRelations'>,
	requestPlayerId: string,
	targetPlayerId: string,
	officialInfo: OfficialFollowInfoState,
): FollowInfoResponse {
	return {
		comment: officialInfo.comment,
		fan_level: officialInfo.fanLevel,
		follow_status: hasFollow(state, requestPlayerId, targetPlayerId) ? 1 : 0,
		follower_status: hasFollow(state, targetPlayerId, requestPlayerId) ? 1 : 0,
		friend_card_info: createOfficialFriendCardInfo(officialInfo),
		last_login_date_time: officialInfo.lastLoginDateTime,
		name: officialInfo.name,
		player_id: targetPlayerId,
		profile_icon_parts_info: officialInfo.profileIconPartsInfo,
	};
}

function createOfficialFriendCardInfo(
	officialInfo: OfficialFollowInfoState,
): FriendCardInfoResponse {
	return officialInfo.friendCardInfo
		.map(createOfficialFriendCardInfoEntry)
		.filter((entry) => entry !== null);
}

function createOfficialFriendCardInfoEntry(
	entry: unknown,
): FriendCardInfoEntryResponse | null {
	if (
		!isRecord(entry) ||
		(entry.card_type !== 1 && entry.card_type !== 2) ||
		!isRecord(entry.user_card_info) ||
		!isUserCardDataState(entry.user_card_info)
	) {
		return null;
	}
	const userCardInfo: ProfileFriendCardInfo = {
		...createOfficialUserCardData(entry.user_card_info),
		generations_id: 0,
		card_sort_order: 0,
		character_bonus: {
			character_id: 0,
			music_mastery_bonus: 0,
			love_correction_value: 0,
			music_mastery_bonus_list: null,
			season_fan_level: 0,
		},
	};
	return { card_type: entry.card_type, user_card_info: userCardInfo };
}

function findRequiredUser(
	state: Pick<ServerState, 'registeredUsers'>,
	playerId: string,
) {
	const user = state.registeredUsers.find(
		(entry) => entry.playerId === playerId,
	);
	if (!user) throw new Error(`registered user not found: ${playerId}`);
	return user;
}
