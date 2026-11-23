import { Hono } from 'hono';
import { ensureUserGachaState } from '../../../state/gacha-aggregate-state.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type { GachaHistoryResponse } from '../../response-types/gacha-response-types.ts';
import { createGachaHistoryResponse } from '../../responses/gacha-response.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import {
	getRequestUser,
	persistRouteStateIfChanged,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createGachaHistoryRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	typedEndpoint<EmptyRequest, GachaHistoryResponse>({ requiresSession: true });
	app.post('/v1/gacha/get_history', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		routeContext.resolveMasterDatabase(c, user);
		const userGachaResult = ensureUserGachaState(
			routeContext.state,
			user.playerId,
		);
		persistRouteStateIfChanged(routeContext, userGachaResult.created);
		return c.json(createGachaHistoryResponse(userGachaResult.value));
	});
	return app;
}
