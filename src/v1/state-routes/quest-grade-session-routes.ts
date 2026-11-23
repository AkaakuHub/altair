import type { Hono } from 'hono';
import {
	setGradeQuestAction,
	setGradeQuestAddSkill,
	setGradeQuestStart,
} from '../active-master-database/grade-quest-session-responses.ts';
import { getGradeStageData } from '../active-master-database/grade-quest-stage-response.ts';
import { readJson } from '../http/read-json.ts';
import type {
	GradeQuestAddSkillRequest,
	GradeQuestSquareRequest,
	GradeQuestStartRequest,
} from '../response-types/quest-extended-request-types.ts';
import type {
	GradeQuestActionResponse,
	GradeQuestAddSkillResponse,
	GradeQuestStageDataResponse,
	GradeQuestStartResponse,
} from '../response-types/quest-extended-response-types.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import {
	isSessionVisibleInRequestMasterRelease,
	resolveMasterReleaseBoundSessionDatabase,
} from '../route-support/master-release-bound-session.ts';
import { getRequestUserLiveSession } from '../route-support/request-user-state.ts';
import { persistRouteState } from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function registerGradeQuestSessionRoutes(
	app: Hono,
	routeContext: StateRouteContext,
): void {
	typedEndpoint<GradeQuestStartRequest, GradeQuestStartResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grade/set_quest_start', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		if (
			session.userLive.currentGradeQuest !== null &&
			!isSessionVisibleInRequestMasterRelease(
				c,
				routeContext,
				session.user,
				session.userLive.currentGradeQuest,
			)
		) {
			return routeContext.respondError(c, 'sessionMasterReleaseUnavailable');
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(
			c,
			session.user,
		);
		const response = setGradeQuestStart(
			masterRelease.database,
			masterRelease.masterReleaseId,
			await readJson(c.req.raw),
			session.userLive,
		);
		persistRouteState(routeContext);
		return routeContext.respondStored(c, routeContext.defaultHeaders, response);
	});

	typedEndpoint<GradeQuestSquareRequest, GradeQuestActionResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grade/set_quest_action', async (c) => {
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
		const response = setGradeQuestAction(
			database,
			await readJson(c.req.raw),
			session.userLive,
		);
		persistRouteState(routeContext);
		return routeContext.respondStored(c, routeContext.defaultHeaders, response);
	});

	typedEndpoint<GradeQuestAddSkillRequest, GradeQuestAddSkillResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grade/set_quest_add_skill', async (c) => {
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
		const response = setGradeQuestAddSkill(
			database,
			await readJson(c.req.raw),
			session.userLive,
		);
		persistRouteState(routeContext);
		return routeContext.respondStored(c, routeContext.defaultHeaders, response);
	});

	typedEndpoint<GradeQuestSquareRequest, GradeQuestStageDataResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grade/get_stage_data', async (c) => {
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
		return routeContext.respondStored(
			c,
			routeContext.defaultHeaders,
			getGradeStageData(database, await readJson(c.req.raw), session.userLive),
		);
	});
}
