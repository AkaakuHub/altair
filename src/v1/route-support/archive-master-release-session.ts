import type { Context } from 'hono';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getArchiveMasterReleaseSession(
	c: Context,
	routeContext: StateRouteContext,
) {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
	return {
		user,
		database: masterRelease.database,
		masterReleaseId: masterRelease.masterReleaseId,
	};
}
