import { Hono } from 'hono';
import { ensureGrandPrixRuntimeState } from '../../server-state.ts';
import { ensureCircleState } from '../../state/circle-aggregate-state.ts';
import {
	getGrandPrixStageData,
	getGrandPrixStageList,
	getGrandPrixStageSelect,
} from '../active-master-database/grand-prix-stage-responses.ts';
import {
	getGrandPrixHistory,
	getGrandPrixRankingList,
	getGrandPrixTopInfo,
} from '../active-master-database/grand-prix-top-ranking-response-service.ts';
import { readJson } from '../http/read-json.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	GrandPrixRankingRequest,
	GrandPrixScopeRequest,
} from '../response-types/quest-extended-request-types.ts';
import type {
	GrandPrixHistoryResponse,
	GrandPrixRankingResponse,
	GrandPrixStageDataResponse,
	GrandPrixStageListResponse,
	GrandPrixStageSelectResponse,
	GrandPrixTopInfoResponse,
} from '../response-types/quest-extended-response-types.ts';
import type {
	QuestIdRequest,
	QuestStageIdRequest,
} from '../response-types/quest-request-types.ts';
import type { GrandPrixResultResponse } from '../response-types/quest-result-response-types.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import {
	createActiveGrandPrixResult,
	getActiveGrandPrixSession,
} from '../route-support/grand-prix-active-state.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../route-support/master-release-bound-session.ts';
import { getRequestUserLiveState } from '../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createGrandPrixQuestRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state } = routeContext;

	typedEndpoint<EmptyRequest, GrandPrixTopInfoResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grand_prix/get_top_info', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		return respondStored(
			c,
			defaultHeaders,
			getGrandPrixTopInfo(
				routeContext.resolveMasterDatabase(c, user),
				ensureGrandPrixRuntimeState(state),
				ensureCircleState(state),
				user,
				state,
			),
		);
	});
	typedEndpoint<GrandPrixScopeRequest, GrandPrixStageSelectResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grand_prix/get_stage_select', async (c) => {
		const body = await readJson(c.req.raw);
		const session = getActiveGrandPrixSession(c, routeContext, body);
		if (session instanceof Response) {
			return session;
		}
		persistRouteStateIfChanged(routeContext, session.created);
		return respondStored(
			c,
			defaultHeaders,
			getGrandPrixStageSelect(
				routeContext.resolveMasterDatabase(c, session.user),
				session.grandPrix,
				ensureGrandPrixRuntimeState(state),
				ensureCircleState(state),
				session.user,
				state,
			),
		);
	});
	typedEndpoint<QuestIdRequest, GrandPrixStageListResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grand_prix/get_stage_list', async (c) => {
		const body = await readJson(c.req.raw);
		const session = getActiveGrandPrixSession(c, routeContext, body);
		if (session instanceof Response) {
			return session;
		}
		persistRouteStateIfChanged(routeContext, session.created);
		return respondStored(
			c,
			defaultHeaders,
			getGrandPrixStageList(
				routeContext.resolveMasterDatabase(c, session.user),
				body,
				session.grandPrix,
				ensureGrandPrixRuntimeState(state),
			),
		);
	});
	typedEndpoint<QuestStageIdRequest, GrandPrixStageDataResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grand_prix/get_stage_data', async (c) => {
		const body = await readJson(c.req.raw);
		const session = getActiveGrandPrixSession(c, routeContext, body);
		if (session instanceof Response) {
			return session;
		}
		persistRouteStateIfChanged(routeContext, session.created);
		return respondStored(
			c,
			defaultHeaders,
			getGrandPrixStageData(
				routeContext.resolveMasterDatabase(c, session.user),
				body,
				session.grandPrix,
				ensureGrandPrixRuntimeState(state),
			),
		);
	});
	typedEndpoint<GrandPrixRankingRequest, GrandPrixRankingResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grand_prix/get_ranking_list', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		return respondStored(
			c,
			defaultHeaders,
			getGrandPrixRankingList(
				routeContext.resolveMasterDatabase(c, user),
				await readJson(c.req.raw),
				ensureGrandPrixRuntimeState(state),
				ensureCircleState(state),
				user,
				state,
			),
		);
	});
	typedEndpoint<GrandPrixScopeRequest, GrandPrixHistoryResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grand_prix/get_history', async (c) => {
		const body = await readJson(c.req.raw);
		const session = getActiveGrandPrixSession(c, routeContext, body);
		if (session instanceof Response) {
			return session;
		}
		persistRouteStateIfChanged(routeContext, session.created);
		return respondStored(
			c,
			defaultHeaders,
			getGrandPrixHistory(
				routeContext.resolveMasterDatabase(c, session.user),
				session.grandPrix,
				session.user,
				ensureCircleState(state),
				state.registeredUsers,
				state.userLives,
				state,
			),
		);
	});
	typedEndpoint<EmptyRequest, GrandPrixResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grand_prix/get_result', (c) => {
		const userLiveResult = getRequestUserLiveState(c, routeContext);
		if (userLiveResult instanceof Response) {
			return userLiveResult;
		}
		const userLive = userLiveResult.value;
		if (userLive.currentQuestLive === null) {
			return routeContext.respondError(c, 'questLiveNotStarted');
		}
		const database = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			userLive.currentQuestLive,
		);
		if (database instanceof Response) {
			return database;
		}
		const response = createActiveGrandPrixResult(
			c,
			routeContext,
			userLive,
			database,
		);
		if (response instanceof Response) {
			return response;
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	return app;
}
