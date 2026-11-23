import type { Context } from 'hono';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function unavailable(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const user = getRequestUser(c, routeContext);
	return user instanceof Response
		? user
		: routeContext.respondError(c, 'liveBroadcastNotFound');
}
