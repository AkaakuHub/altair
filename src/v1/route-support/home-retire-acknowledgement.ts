import type { Context } from 'hono';
import { recordUserNotification } from '../../state/user-notifications-state.ts';
import type { HomeSetShowRetireResponse } from '../response-types/home-retire-response.ts';
import { persistRouteState, withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function acknowledgeHomeRetire(
	c: Context,
	routeContext: StateRouteContext,
) {
	return withRequestUser(c, routeContext, (user) => {
		recordUserNotification(
			routeContext.state,
			user.playerId,
			'/v1/home/set_show_retire',
		);
		persistRouteState(routeContext);
		const response: HomeSetShowRetireResponse = { result: true };
		return c.json(response);
	});
}
