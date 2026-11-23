import type { Hono } from 'hono';
import { retireGradeQuest } from '../active-master-database/grade-quest-result-responses.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { GradeQuestRetireResponse } from '../response-types/quest-result-response-types.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../route-support/master-release-bound-session.ts';
import { getRequestUserLiveSession } from '../route-support/request-user-state.ts';
import { persistRouteState } from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function registerGradeQuestRetireRoutes(
	app: Hono,
	routeContext: StateRouteContext,
): void {
	typedEndpoint<EmptyRequest, GradeQuestRetireResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grade/set_quest_retire', (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		const gradeQuest = session.userLive.currentGradeQuest;
		if (gradeQuest === null) {
			return routeContext.respondError(c, 'questLiveNotStarted');
		}
		const database = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			gradeQuest,
		);
		if (database instanceof Response) return database;
		const response = retireGradeQuest(database, session.userLive);
		persistRouteState(routeContext);
		return routeContext.respondStored(c, routeContext.defaultHeaders, response);
	});
}
