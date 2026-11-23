import { Hono } from 'hono';
import { getSeasonFanLevelTableFromDatabase } from '../../master-data/member-fan-level-master.ts';
import { createFanLevelEarnProgressMap } from '../../state/profile-fan-level-state.ts';
import { findRegisteredUser } from '../../state/registered-user-state.ts';
import { readJson } from '../http/read-json.ts';
import type {
	ProfileFanRankingRequest,
	ProfileOptionalTargetRequest,
} from '../response-types/profile-request-types.ts';
import { createFanLevelRankingResponse } from '../responses/profile-fan-level-ranking-read-model.ts';
import type {
	FanLevelInfoResponse,
	FanLevelRankingResponse,
	ProfileUseFanLevelPointStocksRequest,
	ProfileUseFanLevelPointStocksResponse,
} from '../responses/profile-fan-level-response-types.ts';
import {
	createFanLevelInfoResponse,
	createUseFanLevelPointStocksResponse,
} from '../responses/profile-fan-level-season-projection.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import { readUseSeasonFanLevelPointStockList } from '../route-support/profile-fan-level-request.ts';
import {
	getNumberField,
	getStringField,
} from '../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createProfileFanLevelRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { state } = routeContext;

	typedEndpoint<ProfileOptionalTargetRequest, FanLevelInfoResponse>();
	app.post('/v1/profile/get_fan_level_info', async (c) => {
		const playerId = getStringField(await readJson(c.req.raw), 'player_id');
		const user =
			playerId.length > 0
				? findRegisteredUser(state, playerId)
				: getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		if (!user) return routeContext.respondError(c, 'profileTargetNotFound');
		const userStatus = routeContext.resolveUserStatus(c, user);
		const statusResult = userStatus.ensure(state, user.playerId);
		persistRouteStateIfChanged(routeContext, statusResult.created);
		return c.json(
			createFanLevelInfoResponse(
				statusResult.value,
				userStatus.getCurrentSeasonMemberFanLevels(statusResult.value),
				userStatus,
				createFanLevelEarnProgressMap(state, user.playerId, userStatus),
			),
		);
	});

	apkDumpTypedEndpoint<
		ProfileUseFanLevelPointStocksRequest,
		ProfileUseFanLevelPointStocksResponse
	>();
	app.post('/v1/profile/use_fanlevel_point_stocks', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const userStatus = routeContext.resolveUserStatus(c, user);
		const status = userStatus.ensure(state, user.playerId).value;
		const useStockList = readUseSeasonFanLevelPointStockList(
			await readJson(c.req.raw),
		);
		if (useStockList === undefined)
			return routeContext.respondError(c, 'seasonFanLevelPointStockInvalid');
		const result = userStatus.applySeasonFanLevelPointStocks(
			status,
			useStockList,
			getSeasonFanLevelTableFromDatabase(
				routeContext.resolveMasterDatabase(c, user),
			),
		);
		if (result.result === 'invalidRequest')
			return routeContext.respondError(c, 'seasonFanLevelPointStockInvalid');
		if (result.result === 'insufficientStock')
			return routeContext.respondError(
				c,
				'seasonFanLevelPointStockInsufficient',
			);
		persistRouteState(routeContext);
		return c.json(
			createUseFanLevelPointStocksResponse(
				status,
				userStatus.getCurrentSeasonMemberFanLevels(status),
				userStatus,
			),
		);
	});

	typedEndpoint<ProfileFanRankingRequest, FanLevelRankingResponse>();
	app.post('/v1/profile/get_fan_level_ranking', async (c) => {
		const characterId = getNumberField(
			await readJson(c.req.raw),
			'character_id',
		);
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		if (characterId === undefined)
			return routeContext.respondError(c, 'profileTargetNotFound');
		return c.json(
			createFanLevelRankingResponse(
				state,
				user,
				characterId,
				routeContext.resolveUserStatus(c, user),
			),
		);
	});

	return app;
}
