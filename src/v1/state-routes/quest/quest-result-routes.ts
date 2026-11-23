import { Hono } from 'hono';
import { consumeDailyQuestTicket } from '../../../state/daily-quest-state.ts';
import { getQuestResult } from '../../active-master-database/quest-live-result-response.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type { QuestResultResponse } from '../../response-types/quest-result-response-types.ts';
import { getCurrentQuestLiveState } from '../../route-support/current-quest-live-state.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { createActiveGrandPrixResult } from '../../route-support/grand-prix-active-state.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../../route-support/master-release-bound-session.ts';
import { consumeQuestPlayPoint } from '../../route-support/quest-consumption.ts';
import { questLiveConsumptionKind } from '../../route-support/quest-live-consumption-kind.ts';
import {
	getRequestUserDailyQuestState,
	getRequestUserLiveSession,
} from '../../route-support/request-user-state.ts';
import { persistRouteState } from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createQuestResultRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored } = routeContext;
	typedEndpoint<EmptyRequest, QuestResultResponse>({ requiresSession: true });
	app.post('/v1/out_quest_live/get_result', (c) => {
		const currentQuestLive = getCurrentQuestLiveState(c, routeContext);
		if (currentQuestLive instanceof Response) return currentQuestLive;
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		const { user, userLive } = session;
		const sessionDatabase = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			currentQuestLive,
		);
		if (sessionDatabase instanceof Response) return sessionDatabase;
		if (currentQuestLive.questLiveType === 6) {
			const response = createActiveGrandPrixResult(
				c,
				routeContext,
				userLive,
				sessionDatabase,
			);
			if (response instanceof Response) return response;
			persistRouteState(routeContext);
			return respondStored(c, defaultHeaders, response);
		}
		if (
			questLiveConsumptionKind(currentQuestLive.questLiveType) === 'dailyTicket'
		) {
			const dailyQuest = getRequestUserDailyQuestState(c, routeContext);
			if (dailyQuest instanceof Response) return dailyQuest;
			if (!consumeDailyQuestTicket(dailyQuest)) {
				return routeContext.respondError(c, 'dailyQuestTicketInsufficient');
			}
		} else if (
			!consumeQuestPlayPoint(
				c,
				routeContext,
				currentQuestLive.stageId,
				1,
				sessionDatabase,
			)
		) {
			return routeContext.respondError(c, 'playPointInsufficient');
		}
		const response = getQuestResult(
			sessionDatabase,
			currentQuestLive.masterReleaseId,
			currentQuestLive,
			userLive,
		);
		routeContext.resolveMissionProgress(c, user).apply({
			type: 'questClear',
			playerId: userLive.playerId,
			questLiveType: currentQuestLive.questLiveType,
			isSkip: false,
			gameDate: routeContext.date.currentGameDate(),
			userLive,
		});
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});
	return app;
}
