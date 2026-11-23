import type { Hono } from 'hono';
import { getGradeChallengeQuestList } from '../active-master-database/grade-challenge-list-response.ts';
import { getGradeChallengeRankingList } from '../active-master-database/grade-challenge-ranking-response.ts';
import { getGradeChallengeResult } from '../active-master-database/grade-challenge-result-response.ts';
import type {
	GradeChallengeGetQuestListRequest,
	GradeChallengeGetQuestListResponse,
	GradeChallengeGetRankingListRequest,
	GradeChallengeGetRankingListResponse,
	GradeChallengeGetResultRequest,
	GradeChallengeGetResultResponse,
} from '../active-master-database/grade-challenge-types.ts';
import { readJson } from '../http/read-json.ts';
import { createProfileIconPartsInfo } from '../responses/profile-icon-parts-response.ts';
import { apkDumpTypedEndpoint } from '../route-support/endpoint-source.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../route-support/master-release-bound-session.ts';
import {
	getRequestUserLiveSession,
	getRequestUserLiveState,
} from '../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteState,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function registerGradeChallengeRoutes(
	app: Hono,
	routeContext: StateRouteContext,
): void {
	apkDumpTypedEndpoint<
		GradeChallengeGetQuestListRequest,
		GradeChallengeGetQuestListResponse
	>();
	app.post('/v1/out_quest_live/grade_challenge/get_quest_list', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		return routeContext.respondStored(
			c,
			routeContext.defaultHeaders,
			getGradeChallengeQuestList(
				routeContext.resolveMasterDatabase(c, session.user),
				await readJson(c.req.raw),
				session.userLive,
			),
		);
	});

	apkDumpTypedEndpoint<
		GradeChallengeGetRankingListRequest,
		GradeChallengeGetRankingListResponse
	>();
	app.post('/v1/out_quest_live/grade_challenge/get_ranking_list', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const userLiveResult = getRequestUserLiveState(c, routeContext);
		if (userLiveResult instanceof Response) return userLiveResult;
		return routeContext.respondStored(
			c,
			routeContext.defaultHeaders,
			getGradeChallengeRankingList(
				routeContext.resolveMasterDatabase(c, user),
				await readJson(c.req.raw),
				user,
				userLiveResult.value,
				createProfileIconPartsInfo(routeContext.state, user.playerId),
			),
		);
	});

	apkDumpTypedEndpoint<
		GradeChallengeGetResultRequest,
		GradeChallengeGetResultResponse
	>();
	app.post('/v1/out_quest_live/grade_challenge/get_result', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		const currentQuestLive = session.userLive.currentQuestLive;
		if (currentQuestLive === null) {
			return routeContext.respondError(c, 'questLiveNotStarted');
		}
		const database = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			currentQuestLive,
		);
		if (database instanceof Response) return database;
		const response = getGradeChallengeResult(
			database,
			await readJson(c.req.raw),
			session.userLive,
		);
		if (response === undefined) {
			return routeContext.respondError(c, 'questLiveNotStarted');
		}
		persistRouteState(routeContext);
		return routeContext.respondStored(c, routeContext.defaultHeaders, response);
	});
}
