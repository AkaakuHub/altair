import type { Hono } from 'hono';
import { getGradeQuestList } from '../active-master-database/grade-quest-list-response.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { GradeQuestListResponse } from '../response-types/quest-result-response-types.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { isSessionVisibleInRequestMasterRelease } from '../route-support/master-release-bound-session.ts';
import { getRequestUserLiveSession } from '../route-support/request-user-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function registerGradeQuestListRoutes(
	app: Hono,
	routeContext: StateRouteContext,
): void {
	typedEndpoint<EmptyRequest, GradeQuestListResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grade/get_quest_list', (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		return routeContext.respondStored(
			c,
			routeContext.defaultHeaders,
			getGradeQuestList(
				routeContext.resolveMasterDatabase(c, session.user),
				session.userLive.currentGradeQuest === null ||
					isSessionVisibleInRequestMasterRelease(
						c,
						routeContext,
						session.user,
						session.userLive.currentGradeQuest,
					)
					? session.userLive
					: { ...session.userLive, currentGradeQuest: null },
			),
		);
	});
}
