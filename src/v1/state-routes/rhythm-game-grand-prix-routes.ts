import type { Database } from 'bun:sqlite';
import { Hono } from 'hono';
import {
	getProjectedUserCardDataIds,
	projectUserCards,
} from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureGrandPrixRuntimeState } from '../../server-state.ts';
import { ensureCircleState } from '../../state/circle-aggregate-state.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import {
	resetRhythmGameGrandPrixDeck,
	setRhythmGameGrandPrixCenter,
	setRhythmGameGrandPrixDeck,
	setRhythmGameGrandPrixPosition,
} from '../active-master-database/rhythm-game-grand-prix-deck-response-service.ts';
import {
	retireRhythmGameGrandPrixLive,
	setRhythmGameGrandPrixFinishLive,
	setRhythmGameGrandPrixStartLive,
} from '../active-master-database/rhythm-game-grand-prix-live-responses.ts';
import { getRhythmGameGrandPrixTop } from '../active-master-database/rhythm-game-grand-prix-top-response.ts';
import type {
	RhythmGameGrandPrixEmptyResponse,
	RhythmGameGrandPrixSetCenterRequest,
	RhythmGameGrandPrixSetCenterResponse,
	RhythmGameGrandPrixSetDeckRequest,
	RhythmGameGrandPrixSetDeckResponse,
	RhythmGameGrandPrixSetFinishLiveRequest,
	RhythmGameGrandPrixSetFinishLiveResponse,
	RhythmGameGrandPrixSetPositionRequest,
	RhythmGameGrandPrixSetPositionResponse,
	RhythmGameGrandPrixSetResetRequest,
	RhythmGameGrandPrixSetStartLiveRequest,
	RhythmGameGrandPrixTopRequest,
	RhythmGameGrandPrixTopResponse,
} from '../active-master-database/rhythm-game-grand-prix-types.ts';
import { readJson } from '../http/read-json.ts';
import { apkDumpTypedEndpoint } from '../route-support/endpoint-source.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../route-support/master-release-bound-session.ts';
import {
	ensureRouteUserLiveState,
	getRequestUserLiveSession,
	getRequestUserLiveState,
} from '../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export type RhythmGameGrandPrixSetRetireLiveRequest = Record<string, never>;

export function createRhythmGameGrandPrixRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state, userCardGetList } =
		routeContext;
	const getVisibleCardDataIds = (database: Database, playerId: string) =>
		getProjectedUserCardDataIds(
			projectUserCards(
				ensureUserCards(state, playerId, userCardGetList).value,
				createUserOwnedMasterSupport(database),
			),
		);

	apkDumpTypedEndpoint<
		RhythmGameGrandPrixTopRequest,
		RhythmGameGrandPrixTopResponse
	>();
	app.post('/v1/rhythm_game_grand_prix/top', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLiveResult = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		);
		const userLive = userLiveResult.value;
		const database = routeContext.resolveMasterDatabase(c, user);
		const cardsResult = ensureUserCards(state, user.playerId, userCardGetList);
		persistRouteStateIfChanged(
			routeContext,
			userLiveResult.created || cardsResult.created,
		);
		const visibleCardDataIds = getProjectedUserCardDataIds(
			projectUserCards(
				cardsResult.value,
				createUserOwnedMasterSupport(database),
			),
		);
		return respondStored(
			c,
			defaultHeaders,
			getRhythmGameGrandPrixTop(
				database,
				await readJson(c.req.raw),
				ensureGrandPrixRuntimeState(state),
				ensureCircleState(state),
				user,
				state,
				userLive,
				visibleCardDataIds,
			),
		);
	});

	apkDumpTypedEndpoint<
		RhythmGameGrandPrixSetDeckRequest,
		RhythmGameGrandPrixSetDeckResponse
	>();
	app.post('/v1/rhythm_game_grand_prix/set_deck', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(
			c,
			session.user,
		);
		const database = masterRelease.database;
		const visibleCardDataIds = getVisibleCardDataIds(
			database,
			session.user.playerId,
		);
		const response = setRhythmGameGrandPrixDeck(
			database,
			masterRelease.masterReleaseId,
			await readJson(c.req.raw),
			session.userLive,
			visibleCardDataIds,
		);
		if (response === undefined) {
			return respondStored(c, defaultHeaders, undefined);
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	apkDumpTypedEndpoint<
		RhythmGameGrandPrixSetCenterRequest,
		RhythmGameGrandPrixSetCenterResponse
	>();
	app.post('/v1/rhythm_game_grand_prix/set_center', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(
			c,
			session.user,
		);
		const database = masterRelease.database;
		const response = setRhythmGameGrandPrixCenter(
			database,
			masterRelease.masterReleaseId,
			await readJson(c.req.raw),
			session.userLive,
			getVisibleCardDataIds(database, session.user.playerId),
		);
		if (response === undefined) {
			return respondStored(c, defaultHeaders, undefined);
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	apkDumpTypedEndpoint<
		RhythmGameGrandPrixSetPositionRequest,
		RhythmGameGrandPrixSetPositionResponse
	>();
	app.post('/v1/rhythm_game_grand_prix/set_position', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(
			c,
			session.user,
		);
		const database = masterRelease.database;
		const response = setRhythmGameGrandPrixPosition(
			database,
			masterRelease.masterReleaseId,
			await readJson(c.req.raw),
			session.userLive,
			getVisibleCardDataIds(database, session.user.playerId),
		);
		if (response === undefined) {
			return respondStored(c, defaultHeaders, undefined);
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	apkDumpTypedEndpoint<
		RhythmGameGrandPrixSetResetRequest,
		RhythmGameGrandPrixEmptyResponse
	>();
	app.post('/v1/rhythm_game_grand_prix/set_reset', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const database = routeContext.resolveMasterDatabase(c, session.user);
		const response = resetRhythmGameGrandPrixDeck(
			database,
			await readJson(c.req.raw),
			session.userLive,
			getVisibleCardDataIds(database, session.user.playerId),
		);
		if (response === undefined) {
			return respondStored(c, defaultHeaders, undefined);
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	apkDumpTypedEndpoint<
		RhythmGameGrandPrixSetStartLiveRequest,
		RhythmGameGrandPrixEmptyResponse
	>();
	app.post('/v1/rhythm_game_grand_prix/set_start_live', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLive = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		).value;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const response = setRhythmGameGrandPrixStartLive(
			masterRelease.database,
			masterRelease.masterReleaseId,
			await readJson(c.req.raw),
			userLive,
		);
		if (response === undefined) {
			return respondStored(c, defaultHeaders, undefined);
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	apkDumpTypedEndpoint<
		RhythmGameGrandPrixSetRetireLiveRequest,
		RhythmGameGrandPrixEmptyResponse
	>();
	app.post('/v1/rhythm_game_grand_prix/set_retire_live', (c) => {
		const userLiveResult = getRequestUserLiveState(c, routeContext);
		if (userLiveResult instanceof Response) {
			return userLiveResult;
		}
		const userLive = userLiveResult.value;
		const response = retireRhythmGameGrandPrixLive(userLive);
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	apkDumpTypedEndpoint<
		RhythmGameGrandPrixSetFinishLiveRequest,
		RhythmGameGrandPrixSetFinishLiveResponse
	>();
	app.post('/v1/rhythm_game_grand_prix/set_finish_live', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLive = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		).value;
		const current = userLive.currentRhythmGameGrandPrix;
		if (current === null) {
			return routeContext.respondError(c, 'rhythmGameNotStarted');
		}
		const database = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			current,
		);
		if (database instanceof Response) {
			return database;
		}
		ensureUserCards(state, user.playerId, userCardGetList);
		const response = setRhythmGameGrandPrixFinishLive(
			database,
			await readJson(c.req.raw),
			user,
			state,
			userLive,
		);
		if (response === undefined) {
			return routeContext.respondError(c, 'rhythmGameNotStarted');
		}
		routeContext.resolveMissionProgress(c, user).apply({
			type: 'rhythmGameClear',
			playerId: user.playerId,
			userLive,
		});
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	return app;
}
