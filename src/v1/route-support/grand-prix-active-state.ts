import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import { getGrandPrixRankingMasterFromDatabase } from '../../master-data/grand-prix-ranking-master.ts';
import { ensureGrandPrixRuntimeState } from '../../server-state.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { updateGrandPrixRankingsFromProgress } from '../../state/grand-prix-ranking-aggregate.ts';
import { isRecord } from '../../state/json-state-utils.ts';
import {
	ensureUserGrandPrixState,
	type UserGrandPrixState,
} from '../../state/user-grand-prix-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	findGrandPrixIdByQuestIdFromDatabase,
	findGrandPrixIdByStageIdFromDatabase,
} from '../active-master-database/grand-prix-result-master-query.ts';
import { getGrandPrixResult } from '../active-master-database/grand-prix-result-responses.ts';
import type { StoredResponse } from '../active-master-database/types.ts';
import { getRequestUserLiveSession } from './request-user-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

type ActiveGrandPrixSession = {
	user: RegisteredUserState;
	userLive: UserLiveState;
	grandPrix: UserGrandPrixState;
	created: boolean;
};

export function getActiveGrandPrixSession(
	c: Context,
	routeContext: StateRouteContext,
	body: unknown,
): ActiveGrandPrixSession | Response {
	const session = getRequestUserLiveSession(c, routeContext);
	if (session instanceof Response) {
		return session;
	}
	const grandPrixCount = session.userLive.grandPrixes.length;
	const grandPrix = ensureUserGrandPrixState(
		session.userLive,
		resolveGrandPrixId(c, routeContext, session.user, body),
	);
	return {
		user: session.user,
		userLive: session.userLive,
		grandPrix,
		created:
			session.created || session.userLive.grandPrixes.length !== grandPrixCount,
	};
}

function resolveGrandPrixId(
	c: Context,
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	body: unknown,
): number {
	const runtime = ensureGrandPrixRuntimeState(routeContext.state);
	const database = routeContext.resolveMasterDatabase(c, user);
	if (!isRecord(body)) {
		return runtime.activeGrandPrixId;
	}
	const questId = body.quest_id;
	if (typeof questId === 'number' && Number.isInteger(questId)) {
		return (
			findGrandPrixIdByQuestIdFromDatabase(database, questId) ??
			runtime.activeGrandPrixId
		);
	}
	const stageId = body.stage_id;
	if (typeof stageId === 'number' && Number.isInteger(stageId)) {
		return (
			findGrandPrixIdByStageIdFromDatabase(database, stageId) ??
			runtime.activeGrandPrixId
		);
	}
	return runtime.activeGrandPrixId;
}

export function createActiveGrandPrixResult(
	c: Context,
	routeContext: StateRouteContext,
	userLive: UserLiveState,
	database: Database,
): StoredResponse | Response | undefined {
	const { state } = routeContext;
	if (userLive.currentQuestLive?.questLiveType !== 6) {
		return routeContext.respondError(c, 'questLiveNotStarted');
	}
	const grandPrixId =
		findGrandPrixIdByStageIdFromDatabase(
			database,
			userLive.currentQuestLive.stageId,
		) ?? ensureGrandPrixRuntimeState(state).activeGrandPrixId;
	const grandPrix = ensureUserGrandPrixState(userLive, grandPrixId);
	const response = getGrandPrixResult(
		database,
		grandPrix,
		userLive.currentQuestLive,
	);
	if (userLive.currentQuestLive.isRehearsal !== true) {
		updateGrandPrixRankingsFromProgress(
			state,
			grandPrixId,
			getGrandPrixRankingMasterFromDatabase(database, grandPrixId),
			userLive.currentQuestLive.masterReleaseId,
		);
	}
	return response;
}
