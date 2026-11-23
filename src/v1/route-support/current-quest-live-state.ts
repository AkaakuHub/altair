import type { Context } from 'hono';
import type { UserCurrentQuestLiveState } from '../../state/user-current-quest-live-state.ts';
import { getRequestUserLiveState } from './request-user-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getCurrentQuestLiveState(
	c: Context,
	routeContext: StateRouteContext,
): UserCurrentQuestLiveState | Response {
	const userLiveResult = getRequestUserLiveState(c, routeContext);
	if (userLiveResult instanceof Response) {
		return userLiveResult;
	}
	const userLive = userLiveResult.value;
	if (!userLive.currentQuestLive) {
		return routeContext.respondError(c, 'questLiveNotStarted');
	}
	return userLive.currentQuestLive;
}
