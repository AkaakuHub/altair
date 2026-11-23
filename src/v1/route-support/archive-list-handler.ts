import type { Context } from 'hono';
import { readJson } from '../http/read-json.ts';
import { createArchiveListResponse } from '../responses/archive-list-response-service.ts';
import { createArchiveRankingResponse } from '../responses/archive-ranking-response.ts';
import { readArchiveRankingRequest } from './archive-request.ts';
import { getRequestUserArchiveCollectionState } from './request-user-state.ts';
import { getRequestUser, persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createArchiveListHandler(routeContext: StateRouteContext) {
	return async (c: Context) => {
		const session = getRequestUserArchiveCollectionState(c, routeContext);
		if (session instanceof Response) return session;
		const body = await readJson(c.req.raw);
		persistRouteStateIfChanged(routeContext, session.created);
		return c.json(
			createArchiveListResponse(
				routeContext.resolveMasterDatabase(c, session.user),
				routeContext.state.archiveGiftPoints,
				session.user.playerId,
				body,
			),
		);
	};
}

export function createArchiveRankingListHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const { memberId, targetPeriod } = readArchiveRankingRequest(
			await readJson(c.req.raw),
		);
		return c.json(
			createArchiveRankingResponse(
				routeContext.resolveMasterDatabase(c, user),
				routeContext.state,
				user,
				targetPeriod,
				memberId,
				routeContext.config.currentDate().toISOString(),
			),
		);
	};
}
