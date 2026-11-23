import { Hono } from 'hono';
import { setContentReleaseEffectHistory } from '../../../state/content-release-state.ts';
import { readJson } from '../../http/read-json.ts';
import type { ContentReleaseEffectResponse } from '../../response-types/app-content-response-types.ts';
import type { ContentIdRequest } from '../../response-types/content-request-types.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { getNumberField } from '../../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
export function createContentReleaseRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { state } = routeContext;
	typedEndpoint<ContentIdRequest, ContentReleaseEffectResponse>({
		requiresSession: true,
	});
	app.post('/v1/user/set_contents_release_effect_history', async (c) => {
		const body = await readJson(c.req.raw);
		const contentsId = getNumberField(body, 'contents_id');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		if (contentsId === undefined || contentsId <= 0) {
			return routeContext.respondError(c, 'contentsIdRequired');
		}
		const playerId = user.playerId;
		state.contentReleaseEffects = setContentReleaseEffectHistory(
			state.contentReleaseEffects,
			playerId,
			contentsId,
		);
		persistRouteState(routeContext);
		return c.json({
			contents_id: contentsId,
			status: 1,
		} satisfies ContentReleaseEffectResponse);
	});

	return app;
}
