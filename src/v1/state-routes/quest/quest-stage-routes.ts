import { Hono } from 'hono';
import {
	getQuestClearStatusList,
	getQuestStageData,
	getQuestStageSelect,
	setStandardAreaSelectViewHistory,
} from '../../active-master-database/standard-quest-responses.ts';
import { readJson } from '../../http/read-json.ts';
import type { NullResponse } from '../../response-types/common-response-types.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type {
	QuestAreaIdRequest,
	QuestItemSourceRequest,
	StandardQuestStageDataRequest,
} from '../../response-types/quest-request-types.ts';
import type {
	QuestClearStatusListResponse,
	StandardQuestStageDataResponse,
	StandardQuestStageSelectResponse,
} from '../../response-types/standard-quest-response-types.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import {
	getRequestUserLiveSession,
	getRequestUserLiveState,
} from '../../route-support/request-user-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createQuestStageRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored } = routeContext;
	typedEndpoint<QuestAreaIdRequest, StandardQuestStageSelectResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/standard/get_stage_select', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		return respondStored(
			c,
			defaultHeaders,
			getQuestStageSelect(
				routeContext.resolveMasterDatabase(c, session.user),
				await readJson(c.req.raw),
				session.userLive,
			),
		);
	});
	typedEndpoint<StandardQuestStageDataRequest, StandardQuestStageDataResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/standard/get_stage_data', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		return respondStored(
			c,
			defaultHeaders,
			getQuestStageData(
				routeContext.resolveMasterDatabase(c, session.user),
				await readJson(c.req.raw),
				session.userLive,
			),
		);
	});
	typedEndpoint<EmptyRequest, NullResponse>({ requiresSession: true });
	app.post('/v1/out_quest_live/standard/set_area_select_view_hist', (c) => {
		const userLiveResult = getRequestUserLiveState(c, routeContext);
		if (userLiveResult instanceof Response) return userLiveResult;
		return respondStored(c, defaultHeaders, setStandardAreaSelectViewHistory());
	});
	typedEndpoint<QuestItemSourceRequest, QuestClearStatusListResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/get_quest_clear_status_list', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		return respondStored(
			c,
			defaultHeaders,
			getQuestClearStatusList(
				routeContext.resolveMasterDatabase(c, session.user),
				await readJson(c.req.raw),
				session.userLive,
			),
		);
	});
	return app;
}
