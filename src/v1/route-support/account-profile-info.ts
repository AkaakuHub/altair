import type { Context } from 'hono';
import { projectOwnedStickerIds } from '../../application/archive-sticker-projection.ts';
import { projectUserCards } from '../../application/user-owned-master-projection.ts';
import { getCollectionStickerInfoListFromDatabase } from '../../master-data/collection-sticker-info.ts';
import { getStickerIdentityFingerprint } from '../../master-data/sticker-identity.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { calculateFanLevel } from '../../state/fan-level-calculation.ts';
import { hasFollow } from '../../state/follow-state.ts';
import { createFriendCardInfo } from '../../state/friend-card-profile-projection.ts';
import {
	createProfileCircleInfo,
	ensureUserProfileDesign,
	PROFILE_FOLLOW_STATUS_FOLLOWING,
	PROFILE_FOLLOW_STATUS_NOT_FOLLOWING,
	PROFILE_FRIEND_REQUEST_STATUS_ALREADY_FRIEND,
	PROFILE_FRIEND_REQUEST_STATUS_NOT_REQUESTED,
	PROFILE_FRIEND_REQUEST_STATUS_REQUESTABLE,
	type ProfileFollowStatus,
	type ProfileFriendRequestStatus,
} from '../../state/profile-design-state.ts';
import { ensureUserProfileSettings } from '../../state/profile-settings-state.ts';
import { findRegisteredUser } from '../../state/registered-user-state.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { getOwnedStickerIds } from '../../state/user-sticker-ownership.ts';
import {
	getProfileStatsFromDatabase,
	getProfileUserProgressStatsFromDatabase,
} from '../active-master-database/profile-stats.ts';
import {
	createProfileInfo,
	type ProfileInfo,
} from '../responses/profile-response.ts';
import { createFanLevelList } from './fan-level-response-mapper.ts';
import {
	ensureRouteUserArchiveCollectionState,
	ensureRouteUserLiveState,
} from './request-user-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getProfileFollowRelationStatus(
	state: Pick<StateRouteContext['state'], 'followRelations'>,
	requestPlayerId: string,
	targetPlayerId: string,
	isMuted: boolean,
): {
	friendRequestStatus: ProfileFriendRequestStatus;
	followStatus: ProfileFollowStatus;
} {
	if (requestPlayerId === targetPlayerId || isMuted) {
		return {
			friendRequestStatus:
				requestPlayerId === targetPlayerId
					? PROFILE_FRIEND_REQUEST_STATUS_NOT_REQUESTED
					: PROFILE_FRIEND_REQUEST_STATUS_REQUESTABLE,
			followStatus: PROFILE_FOLLOW_STATUS_NOT_FOLLOWING,
		};
	}
	const isFollowing = hasFollow(state, requestPlayerId, targetPlayerId);
	return {
		friendRequestStatus: isFollowing
			? PROFILE_FRIEND_REQUEST_STATUS_ALREADY_FRIEND
			: PROFILE_FRIEND_REQUEST_STATUS_REQUESTABLE,
		followStatus: isFollowing
			? PROFILE_FOLLOW_STATUS_FOLLOWING
			: PROFILE_FOLLOW_STATUS_NOT_FOLLOWING,
	};
}

export function createProfileInfoForUser(
	routeContext: StateRouteContext,
	c: Context,
	playerId: string,
): ProfileInfo {
	const { state, userCardGetList } = routeContext;
	const user = findRegisteredUser(state, playerId);
	if (!user) {
		throw new Error(`Profile target user is missing: ${playerId}`);
	}
	const design = ensureUserProfileDesign(state, user.playerId).value;
	const canonicalCards = ensureUserCards(
		state,
		user.playerId,
		userCardGetList,
	).value;
	const live = ensureRouteUserLiveState(routeContext, user.playerId).value;
	const database = routeContext.resolveMasterDatabase(c, user);
	const cards = projectUserCards(
		canonicalCards,
		createUserOwnedMasterSupport(database),
	);
	const userStatus = routeContext.resolveUserStatus(c, user);
	const status = userStatus.ensure(state, user.playerId).value;
	const settings = ensureUserProfileSettings(state, user.playerId).value;
	const collection = ensureRouteUserArchiveCollectionState(
		routeContext,
		user.playerId,
	).value;
	return createProfileInfo(
		design,
		user,
		cards,
		getProfileStatsFromDatabase(database),
		getProfileUserProgressStatsFromDatabase(database, live),
		calculateFanLevel(userStatus.getMemberFanLevels(status)),
		createFanLevelList(userStatus.getCurrentSeasonMemberFanLevels(status)),
		settings.comment,
		createProfileCircleInfo(state.circle, user.playerId),
		projectOwnedStickerIds(
			getOwnedStickerIds(collection, (stickerId) =>
				getStickerIdentityFingerprint(database, stickerId),
			),
			new Set(
				getCollectionStickerInfoListFromDatabase(database).map(
					(sticker) => sticker.stickers_id,
				),
			),
		).length,
		createFriendCardInfo(state, cards, user.playerId),
	);
}
