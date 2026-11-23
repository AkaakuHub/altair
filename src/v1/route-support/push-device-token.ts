import type { Context } from 'hono';
import { ensureUserSession } from '../../state/user-session-state.ts';
import { readJson } from '../http/read-json.ts';
import { getStringField } from './request-fields.ts';
import { persistRouteState, withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function setRequestUserPushDeviceToken(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	return withRequestUser(c, routeContext, async (user) => {
		const token = getStringField(await readJson(c.req.raw), 'token');
		if (token.length > 0) {
			ensureUserSession(
				routeContext.state,
				user.playerId,
			).value.pushDeviceToken = token;
			persistRouteState(routeContext);
		}
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(null);
	});
}
