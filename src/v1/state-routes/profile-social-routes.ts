import { Hono } from 'hono';
import {
	ensureUserSocialState,
	removeMutedPlayer,
	setMutedPlayer,
	setReportApplication,
} from '../../state/user-social-aggregate.ts';
import { readJson } from '../http/read-json.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { MuteListResponse } from '../response-types/follow-response-types.ts';
import type {
	ProfileReportRequest,
	ProfileTargetRequest,
} from '../response-types/profile-request-types.ts';
import { createMuteListResponse } from '../responses/social-basic-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
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

export function createProfileSocialRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { state } = routeContext;

	typedEndpoint<EmptyRequest, MuteListResponse>();
	app.post('/v1/profile/get_mute_list', (c) =>
		withRequestUser(c, routeContext, (user) => {
			const socialResult = ensureUserSocialState(state, user.playerId);
			persistRouteStateIfChanged(routeContext, socialResult.created);
			return c.json(createMuteListResponse(socialResult.value));
		}),
	);

	typedEndpoint<ProfileTargetRequest, ResultResponse>();
	app.post('/v1/profile/set_mute', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const targetPlayerId = getStringField(
			await readJson(c.req.raw),
			'player_id',
		);
		if (!setMutedPlayer(state, user.playerId, targetPlayerId))
			return routeContext.respondError(c, 'profileTargetNotFound');
		persistRouteState(routeContext);
		return c.json({ result: true } satisfies ResultResponse);
	});

	typedEndpoint<ProfileTargetRequest, ResultResponse>();
	app.post('/v1/profile/set_mute_cancel', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const targetPlayerId = getStringField(
			await readJson(c.req.raw),
			'player_id',
		);
		if (!removeMutedPlayer(state, user.playerId, targetPlayerId))
			return routeContext.respondError(c, 'profileTargetNotFound');
		persistRouteState(routeContext);
		return c.json({ result: true } satisfies ResultResponse);
	});

	typedEndpoint<ProfileReportRequest, ResultResponse>();
	app.post('/v1/profile/set_report', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const body = await readJson(c.req.raw);
		if (
			!setReportApplication(
				state,
				user.playerId,
				getStringField(body, 'player_id'),
				getNumberField(body, 'report_type'),
			)
		)
			return routeContext.respondError(c, 'profileTargetNotFound');
		persistRouteState(routeContext);
		return c.json({ result: true } satisfies ResultResponse);
	});

	return app;
}
