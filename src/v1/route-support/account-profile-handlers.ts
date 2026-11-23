import type { Context } from 'hono';
import { findRegisteredUser } from '../../state/registered-user-state.ts';
import {
	hasMutedPlayer,
	hasReportedPlayer,
} from '../../state/user-social-aggregate.ts';
import { readJson } from '../http/read-json.ts';
import { createProfileInfoResponse } from '../responses/profile-response.ts';
import {
	createProfileInfoForUser,
	getProfileFollowRelationStatus,
} from './account-profile-info.ts';
import { getStringField } from './request-fields.ts';
import { withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function getProfileInfo(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return withRequestUser(c, context, async (requestUser) => {
		const playerId = getStringField(await readJson(c.req.raw), 'player_id');
		const user = findRegisteredUser(context.state, playerId);
		if (!user) {
			return context.respondError(c, 'profileTargetNotFound');
		}
		const isMuted = hasMutedPlayer(
			context.state,
			requestUser.playerId,
			user.playerId,
		);
		const followRelationStatus = getProfileFollowRelationStatus(
			context.state,
			requestUser.playerId,
			user.playerId,
			isMuted,
		);
		return c.json(
			createProfileInfoResponse(
				createProfileInfoForUser(context, c, user.playerId),
				requestUser.playerId === user.playerId,
				followRelationStatus.friendRequestStatus,
				followRelationStatus.followStatus,
				isMuted,
				hasReportedPlayer(context.state, requestUser.playerId, user.playerId),
			),
		);
	});
}
