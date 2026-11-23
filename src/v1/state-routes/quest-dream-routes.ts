import { Hono } from 'hono';
import {
	getDreamResult,
	notifyDreamMemberReleaseConfirm,
} from '../active-master-database/dream-quest-result-responses.ts';
import type { NullResponse } from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { DreamQuestResultResponse } from '../response-types/quest-result-response-types.ts';
import { getCurrentQuestLiveState } from '../route-support/current-quest-live-state.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../route-support/master-release-bound-session.ts';
import { consumeDreamQuestItem } from '../route-support/quest-consumption.ts';
import { getRequestUserLiveSession } from '../route-support/request-user-state.ts';
import { persistRouteState } from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createQuestDreamRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored } = routeContext;

	typedEndpoint<EmptyRequest, NullResponse>();
	app.post('/v1/out_quest_live/dream/notify_member_release_confirm', (c) =>
		respondStored(c, defaultHeaders, notifyDreamMemberReleaseConfirm()),
	);
	typedEndpoint<EmptyRequest, DreamQuestResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/dream/get_result', (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const { user, userLive } = session;
		const currentQuestLive = getCurrentQuestLiveState(c, routeContext);
		if (currentQuestLive instanceof Response) {
			return currentQuestLive;
		}
		const sessionDatabase = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			currentQuestLive,
		);
		if (sessionDatabase instanceof Response) return sessionDatabase;
		if (
			!consumeDreamQuestItem(
				c,
				routeContext,
				currentQuestLive.stageId,
				currentQuestLive.masterReleaseId,
			)
		) {
			return routeContext.respondError(c, 'userItemInsufficient');
		}
		const response = getDreamResult(
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
		});
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	return app;
}
