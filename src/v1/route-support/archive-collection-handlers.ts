import type { Context } from 'hono';
import {
	getArchiveHomeFromDatabase,
	getWithStationListFromDatabase,
} from '../active-master-database/archive-list-responses.ts';
import { getRequestUserArchiveCollectionState } from './request-user-state.ts';
import { getRequestUser, persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createArchiveHomeHandler(routeContext: StateRouteContext) {
	return (c: Context) => {
		const session = getRequestUserArchiveCollectionState(c, routeContext);
		if (session instanceof Response) return session;
		persistRouteStateIfChanged(routeContext, session.created);
		const archive = getArchiveHomeFromDatabase(
			routeContext.resolveMasterDatabase(c, session.user),
		);
		return routeContext.respondStored(c, routeContext.defaultHeaders, {
			...archive,
			body:
				routeContext.projectArchiveHome?.(
					archive.body,
					session.user.playerId,
				) ?? archive.body,
		});
	};
}

export function createArchiveWithStationListHandler(
	routeContext: StateRouteContext,
) {
	return (c: Context) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		return routeContext.respondStored(
			c,
			routeContext.defaultHeaders,
			getWithStationListFromDatabase(
				routeContext.resolveMasterDatabase(c, user),
			),
		);
	};
}
