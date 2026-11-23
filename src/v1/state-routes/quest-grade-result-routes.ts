import type { Hono } from 'hono';
import { runRewardClaimMutation } from '../../application/reward-claim-service.ts';
import { getGradeResult } from '../active-master-database/grade-quest-result-responses.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { GradeQuestResultResponse } from '../response-types/quest-result-response-types.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { applyGradeQuestRewards } from '../route-support/grade-quest-rewards.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../route-support/master-release-bound-session.ts';
import { getRequestUserLiveState } from '../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteState,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function registerGradeQuestResultRoutes(
	app: Hono,
	routeContext: StateRouteContext,
): void {
	typedEndpoint<EmptyRequest, GradeQuestResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/grade/get_result', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const userLiveResult = getRequestUserLiveState(c, routeContext);
		if (userLiveResult instanceof Response) return userLiveResult;
		const userLive = userLiveResult.value;
		if (userLive.currentGradeQuest === null) {
			return routeContext.respondError(c, 'questLiveNotStarted');
		}
		const currentGradeQuest = userLive.currentGradeQuest;
		if (currentGradeQuest.masterReleaseId === undefined) {
			return routeContext.respondError(c, 'sessionMasterReleaseUnavailable');
		}
		const sourceMasterReleaseId = currentGradeQuest.masterReleaseId;
		const database = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			currentGradeQuest,
		);
		if (database instanceof Response) return database;
		const response = runRewardClaimMutation(routeContext.state, () => {
			const result = getGradeResult(database, userLive);
			applyGradeQuestRewards(
				c,
				routeContext,
				user,
				result?.body,
				database,
				sourceMasterReleaseId,
			);
			return result;
		});
		persistRouteState(routeContext);
		return routeContext.respondStored(c, routeContext.defaultHeaders, response);
	});
}
