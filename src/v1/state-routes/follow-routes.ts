import { Hono } from 'hono';
import {
	getProjectedUserCardDataIds,
	projectUserCards,
} from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { setFollowRelation } from '../../state/follow-state.ts';
import { setUserFriendCard } from '../../state/friend-card-reference-state.ts';
import { findRegisteredUser } from '../../state/registered-user-state.ts';
import { findUserCards } from '../../state/user-card-aggregate-state.ts';
import {
	markFriendRequestRead,
	markFriendRequestUnread,
} from '../../state/user-header-state.ts';
import { hasMutedPlayer } from '../../state/user-social-aggregate.ts';
import { readJson } from '../http/read-json.ts';
import type {
	ResultCodeResponse,
	ResultResponse,
} from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	FollowMutationRequest,
	FriendCardRequest,
} from '../response-types/follow-request-types.ts';
import type {
	FollowerListResponse,
	FollowListResponse,
	FollowRecommendListResponse,
	LiveChatGroupListResponse,
} from '../response-types/follow-response-types.ts';
import type { ProfileTargetRequest } from '../response-types/profile-request-types.ts';
import {
	createFollowerListResponse,
	createFollowListResponse,
	createFollowRecommendListResponse,
} from '../responses/follow-directory-response.ts';
import {
	createFollowSearchMissResponse,
	createLiveChatGroupListResponse,
} from '../responses/social-basic-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import {
	createFollowMutationSource,
	createFollowResponseSource,
} from '../route-support/follow-route-source.ts';
import {
	getNumberField,
	getStringField,
} from '../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
	withRequestUser,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createFollowRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, state } = routeContext;

	typedEndpoint<EmptyRequest, FollowRecommendListResponse>({
		requiresSession: true,
	});
	app.post('/v1/follow/recommend_list', (c) => {
		return withRequestUser(c, routeContext, (user) => {
			const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
			return c.json(
				createFollowRecommendListResponse(
					createFollowResponseSource(state),
					user.playerId,
					routeContext.resolveUserStatus(c, user),
					createUserOwnedMasterSupport(masterRelease.database),
				),
			);
		});
	});

	typedEndpoint<ProfileTargetRequest, ResultCodeResponse>({
		requiresSession: true,
	});
	app.post('/v1/follow/search_id', (c) => {
		return withRequestUser(c, routeContext, async () => {
			const body = await readJson(c.req.raw);
			const targetPlayerId = getStringField(body, 'player_id');
			const target = findRegisteredUser(state, targetPlayerId);
			if (!target) {
				return c.json(createFollowSearchMissResponse());
			}
			return c.json({ resultCode: 0 } satisfies ResultCodeResponse);
		});
	});

	typedEndpoint<EmptyRequest, LiveChatGroupListResponse>({
		requiresSession: true,
	});
	app.post('/v1/follow/live_chat_group_list', (c) => {
		return withRequestUser(c, routeContext, () =>
			c.json(createLiveChatGroupListResponse()),
		);
	});

	typedEndpoint<EmptyRequest, FollowListResponse>({ requiresSession: true });
	app.post('/v1/follow/get_list', (c) => {
		return withRequestUser(c, routeContext, (user) => {
			const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
			return c.json(
				createFollowListResponse(
					createFollowResponseSource(state),
					user.playerId,
					routeContext.resolveUserStatus(c, user),
					createUserOwnedMasterSupport(masterRelease.database),
				),
			);
		});
	});

	typedEndpoint<EmptyRequest, FollowerListResponse>({ requiresSession: true });
	app.post('/v1/follow/get_follower_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const changed = markFriendRequestRead(state, user.playerId);
		persistRouteStateIfChanged(routeContext, changed);
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json(
			createFollowerListResponse(
				createFollowResponseSource(state),
				user.playerId,
				routeContext.resolveUserStatus(c, user),
				createUserOwnedMasterSupport(
					routeContext.resolveRequestMasterRelease(c, user).database,
				),
			),
		);
	});

	typedEndpoint<FollowMutationRequest, ResultCodeResponse>({
		requiresSession: true,
	});
	app.post('/v1/follow/set_follow', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const body = await readJson(c.req.raw);
		const targetPlayerId = getStringField(body, 'player_id');
		const followType = getNumberField(body, 'follow_type');
		if (
			followType === undefined ||
			(followType === 1 &&
				hasMutedPlayer(state, user.playerId, targetPlayerId)) ||
			!setFollowRelation(
				createFollowMutationSource(state),
				user.playerId,
				targetPlayerId,
				followType,
			)
		) {
			return routeContext.respondError(c, 'followTargetNotFound');
		}
		if (followType === 1) {
			markFriendRequestUnread(state, targetPlayerId);
		}
		persistRouteState(routeContext);
		return c.json({ resultCode: 0 } satisfies ResultCodeResponse);
	});

	typedEndpoint<FriendCardRequest, ResultResponse>({ requiresSession: true });
	app.post('/v1/follow/set_friend_card', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const body = await readJson(c.req.raw);
		const cards = findUserCards(state, user.playerId);
		if (cards === undefined) {
			return routeContext.respondError(c, 'userCardNotFound');
		}
		const visibleCardDataIds = getProjectedUserCardDataIds(
			projectUserCards(
				cards,
				createUserOwnedMasterSupport(
					routeContext.resolveMasterDatabase(c, user),
				),
			),
		);
		if (
			!setUserFriendCard(
				{ userFriendCards: state.userFriendCards },
				visibleCardDataIds,
				user.playerId,
				getStringField(body, 'school_idol_stage_card_id'),
				getStringField(body, 'rhythm_game_card_id'),
			)
		) {
			return routeContext.respondError(c, 'userCardNotFound');
		}
		persistRouteState(routeContext);
		return c.json({ result: true } satisfies ResultResponse);
	});

	return app;
}
