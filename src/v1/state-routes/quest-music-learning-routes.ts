import { Hono } from 'hono';
import { projectUserInventory } from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import {
	getMusicLearningResult,
	getMusicLearningSelect,
	setMusicLearningMusic,
} from '../active-master-database/learning-live-response-service.ts';
import { readJson } from '../http/read-json.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { MusicLearningMusicRequest } from '../response-types/quest-extended-request-types.ts';
import type {
	MusicLearningMusicResponse,
	MusicLearningResultResponse,
	MusicLearningSelectResponse,
} from '../response-types/quest-extended-response-types.ts';
import { getCurrentQuestLiveState } from '../route-support/current-quest-live-state.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../route-support/master-release-bound-session.ts';
import { consumeQuestPlayPoint } from '../route-support/quest-consumption.ts';
import { getRequestUserLiveSession } from '../route-support/request-user-state.ts';
import { persistRouteState } from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createQuestMusicLearningRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state, userItemsGetList } =
		routeContext;

	typedEndpoint<EmptyRequest, MusicLearningSelectResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/music_learning/get_music_select', (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const { user, userLive } = session;
		const inventoryResult = ensureUserInventory(
			state,
			userLive.playerId,
			userItemsGetList,
		);
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const inventory = projectUserInventory(
			inventoryResult.value,
			createUserOwnedMasterSupport(database),
		);
		const response = getMusicLearningSelect(
			database,
			masterRelease.masterReleaseId,
			userLive,
			inventory,
		);
		if (session.created || inventoryResult.created) {
			persistRouteState(routeContext);
		}
		return respondStored(c, defaultHeaders, response);
	});
	typedEndpoint<MusicLearningMusicRequest, MusicLearningMusicResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/music_learning/set_music', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const { user, userLive } = session;
		const { value: inventory } = ensureUserInventory(
			state,
			userLive.playerId,
			userItemsGetList,
		);
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const response = setMusicLearningMusic(
			masterRelease.database,
			masterRelease.masterReleaseId,
			await readJson(c.req.raw),
			userLive,
			inventory,
		);
		if (!response) {
			return routeContext.respondError(c, 'userItemInsufficient');
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});
	typedEndpoint<EmptyRequest, MusicLearningResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/music_learning/get_result', (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const { userLive } = session;
		const currentQuestLive = getCurrentQuestLiveState(c, routeContext);
		if (currentQuestLive instanceof Response) {
			return currentQuestLive;
		}
		if (!consumeQuestPlayPoint(c, routeContext, currentQuestLive.stageId)) {
			return routeContext.respondError(c, 'playPointInsufficient');
		}
		const database = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			currentQuestLive,
		);
		if (database instanceof Response) {
			return database;
		}
		const masterReleaseId = currentQuestLive.masterReleaseId;
		if (masterReleaseId === undefined) {
			return routeContext.respondError(c, 'sessionMasterReleaseUnavailable');
		}
		const response = getMusicLearningResult(
			database,
			masterReleaseId,
			currentQuestLive,
			userLive,
		);
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	return app;
}
