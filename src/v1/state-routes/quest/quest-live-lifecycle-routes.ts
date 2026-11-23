import { Hono } from 'hono';
import { getQuestLiveInfo } from '../../active-master-database/quest-live-info-response.ts';
import {
	setQuestFinish,
	setQuestRetire,
	setQuestStart,
} from '../../active-master-database/quest-live-lifecycle-responses.ts';
import { readJson } from '../../http/read-json.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type {
	QuestLiveFinishResponse,
	QuestLiveInfoResponse,
	QuestLiveRetireResponse,
	QuestLiveStartResponse,
} from '../../response-types/quest-live-response-types.ts';
import type {
	QuestLiveFinishRequest,
	QuestLiveStartRequest,
} from '../../response-types/quest-request-types.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { createFanLevelList } from '../../route-support/fan-level-response-mapper.ts';
import {
	isSessionVisibleInRequestMasterRelease,
	resolveMasterReleaseBoundSessionDatabase,
} from '../../route-support/master-release-bound-session.ts';
import {
	getRequestUserLiveSession,
	getRequestUserLiveState,
} from '../../route-support/request-user-state.ts';
import { persistRouteState } from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createQuestLiveLifecycleRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state } = routeContext;
	typedEndpoint<QuestLiveStartRequest, QuestLiveStartResponse>({
		requiresSession: true,
	});
	app.post('/v1/in_quest_live/set_start', async (c) => {
		const userLiveResult = getRequestUserLiveState(c, routeContext);
		if (userLiveResult instanceof Response) return userLiveResult;
		const response = setQuestStart(
			await readJson(c.req.raw),
			userLiveResult.value,
		);
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});
	typedEndpoint<EmptyRequest, QuestLiveInfoResponse>({ requiresSession: true });
	app.post('/v1/in_quest_live/get_live_info', (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		const { user, userLive } = session;
		if (
			userLive.currentQuestLive !== null &&
			!isSessionVisibleInRequestMasterRelease(
				c,
				routeContext,
				user,
				userLive.currentQuestLive,
			)
		) {
			return routeContext.respondError(c, 'questLiveNotStarted');
		}
		const userStatus = routeContext.resolveUserStatus(c, user);
		const status = userStatus.ensure(state, userLive.playerId).value;
		return respondStored(
			c,
			defaultHeaders,
			getQuestLiveInfo(
				routeContext.resolveMasterDatabase(c, user),
				userLive,
				createFanLevelList(userStatus.getCurrentSeasonMemberFanLevels(status)),
			),
		);
	});
	typedEndpoint<QuestLiveFinishRequest, QuestLiveFinishResponse>({
		requiresSession: true,
	});
	app.post('/v1/in_quest_live/set_finish', async (c) => {
		const userLiveResult = getRequestUserLiveState(c, routeContext);
		if (userLiveResult instanceof Response) return userLiveResult;
		const userLive = userLiveResult.value;
		if (userLive.currentQuestLive !== null) {
			const database = resolveMasterReleaseBoundSessionDatabase(
				c,
				routeContext,
				userLive.currentQuestLive,
			);
			if (database instanceof Response) return database;
		}
		const response = setQuestFinish(await readJson(c.req.raw), userLive);
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});
	typedEndpoint<EmptyRequest, QuestLiveRetireResponse>({
		requiresSession: true,
	});
	app.post('/v1/in_quest_live/set_retire', (c) => {
		const userLiveResult = getRequestUserLiveState(c, routeContext);
		if (userLiveResult instanceof Response) return userLiveResult;
		const response = setQuestRetire(userLiveResult.value);
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});
	return app;
}
