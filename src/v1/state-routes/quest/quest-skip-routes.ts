import { Hono } from 'hono';
import { consumeDailyQuestTicket } from '../../../state/daily-quest-state.ts';
import { skipQuest } from '../../active-master-database/quest-skip-responses.ts';
import { readJson } from '../../http/read-json.ts';
import type { QuestSkipRequest } from '../../response-types/quest-result-request-types.ts';
import type { QuestSkipResponse } from '../../response-types/quest-result-response-types.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { consumeQuestPlayPoint } from '../../route-support/quest-consumption.ts';
import { questLiveConsumptionKind } from '../../route-support/quest-live-consumption-kind.ts';
import {
	getQuestStageId,
	getSkipCount,
	getSkipQuestLiveType,
} from '../../route-support/quest-request.ts';
import {
	getRequestUserDailyQuestState,
	getRequestUserLiveSession,
} from '../../route-support/request-user-state.ts';
import { persistRouteState } from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createQuestSkipRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored } = routeContext;
	typedEndpoint<QuestSkipRequest, QuestSkipResponse>({ requiresSession: true });
	app.post('/v1/in_quest_live/skip_quest', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		const { user, userLive } = session;
		const body = await readJson(c.req.raw);
		const stageId = getQuestStageId(body);
		const questLiveType = getSkipQuestLiveType(body);
		const skipCount = getSkipCount(body);
		if (stageId === null || questLiveType === null || skipCount === null) {
			return routeContext.respondError(c, 'endpointNotImplemented');
		}
		if (questLiveConsumptionKind(questLiveType) === 'dailyTicket') {
			const dailyQuest = getRequestUserDailyQuestState(c, routeContext);
			if (dailyQuest instanceof Response) return dailyQuest;
			if (!consumeDailyQuestTicket(dailyQuest)) {
				return routeContext.respondError(c, 'dailyQuestTicketInsufficient');
			}
		} else if (!consumeQuestPlayPoint(c, routeContext, stageId, skipCount)) {
			return routeContext.respondError(c, 'playPointInsufficient');
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const response = skipQuest(
			masterRelease.database,
			masterRelease.masterReleaseId,
			userLive,
			questLiveType,
			stageId,
			skipCount,
		);
		routeContext.resolveMissionProgress(c, user).apply({
			type: 'questClear',
			playerId: userLive.playerId,
			questLiveType,
			isSkip: true,
			gameDate: routeContext.date.currentGameDate(),
		});
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});
	return app;
}
