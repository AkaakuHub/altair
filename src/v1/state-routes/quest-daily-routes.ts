import { Hono } from 'hono';
import { recoverDailyQuestChallengeCount } from '../../state/daily-quest-state.ts';
import {
	getDailyQuestStageData,
	getDailyQuestStageList,
} from '../active-master-database/daily-quest-responses.ts';
import { readJson } from '../http/read-json.ts';
import type {
	DailyQuestRecoveryChallengeCountResponse,
	DailyQuestRecoveryResultResponse,
} from '../response-types/app-content-response-types.ts';
import type {
	DailyQuestStageDataResponse,
	DailyQuestStageListResponse,
} from '../response-types/daily-quest-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	QuestIdRequest,
	QuestRecoveryCountRequest,
	QuestStageIdRequest,
} from '../response-types/quest-request-types.ts';
import {
	createDailyQuestRecoveryChallengeCountResponse,
	createDailyQuestRecoveryResultResponse,
	createDailyQuestTicketInfo,
} from '../responses/app-content-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { readRecoveryCount } from '../route-support/quest-request.ts';
import {
	getRequestUserDailyQuestState,
	getRequestUserLiveSession,
} from '../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteState,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createDailyQuestRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state } = routeContext;

	typedEndpoint<QuestIdRequest, DailyQuestStageListResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/daily/get_stage_list', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const { user, userLive } = session;
		const dailyQuest = getRequestUserDailyQuestState(c, routeContext);
		if (dailyQuest instanceof Response) {
			return dailyQuest;
		}
		return respondStored(
			c,
			defaultHeaders,
			getDailyQuestStageList(
				routeContext.resolveMasterDatabase(c, user),
				await readJson(c.req.raw),
				userLive,
				createDailyQuestTicketInfo(
					dailyQuest,
					routeContext.date.nextGameDateBoundaryIsoDateTime(),
				),
			),
		);
	});
	typedEndpoint<QuestStageIdRequest, DailyQuestStageDataResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/daily/get_stage_data', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const { user, userLive } = session;
		const dailyQuest = getRequestUserDailyQuestState(c, routeContext);
		if (dailyQuest instanceof Response) {
			return dailyQuest;
		}
		return respondStored(
			c,
			defaultHeaders,
			getDailyQuestStageData(
				routeContext.resolveMasterDatabase(c, user),
				await readJson(c.req.raw),
				userLive,
				createDailyQuestTicketInfo(
					dailyQuest,
					routeContext.date.nextGameDateBoundaryIsoDateTime(),
				),
			),
		);
	});
	typedEndpoint<EmptyRequest, DailyQuestRecoveryChallengeCountResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/daily/get_recovery_challenge_count', (c) => {
		const dailyQuest = getRequestUserDailyQuestState(c, routeContext);
		if (dailyQuest instanceof Response) {
			return dailyQuest;
		}
		return respondStored(c, defaultHeaders, {
			body: createDailyQuestRecoveryChallengeCountResponse(
				dailyQuest,
				routeContext.date.currentGameDate(),
			),
			statusCode: 200,
		});
	});
	typedEndpoint<QuestRecoveryCountRequest, DailyQuestRecoveryResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/daily/recovery_challenge_count', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const dailyQuest = getRequestUserDailyQuestState(c, routeContext);
		if (dailyQuest instanceof Response) {
			return dailyQuest;
		}
		const status = routeContext
			.resolveUserStatus(c, user)
			.ensure(state, user.playerId).value;
		const recoveryResult = recoverDailyQuestChallengeCount(
			dailyQuest,
			status,
			readRecoveryCount(await readJson(c.req.raw)),
			routeContext.date.currentGameDate(),
		);
		if (recoveryResult === undefined) {
			return routeContext.respondError(c, 'playPointInsufficient');
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, {
			body: createDailyQuestRecoveryResultResponse(recoveryResult),
			statusCode: 200,
		});
	});

	return app;
}
