import { Hono } from 'hono';
import { receiveCommonMissionRewards } from '../../../application/common-mission-reward-service.ts';
import { getReceivableCommonMissionRewardsFromDatabase } from '../../../master-data/common-mission-master-data.ts';
import { getReceivedCommonMissionOrder } from '../../../state/mission-common-receipt.ts';
import { getCommonMissionStarTotal } from '../../../state/mission-star-progress-sync.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type {
	CommonMissionRewardResponse,
	MissionListResponse,
} from '../../response-types/mission-response-types.ts';
import { createMissionListResponse } from '../../responses/mission-list-response.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { ensureRouteUserLiveState } from '../../route-support/request-user-state.ts';
import { createRewardMasterData } from '../../route-support/reward-master-data.ts';
import {
	persistRouteStateIfChanged,
	withRequestUser,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
export function createCommonMissionRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, state } = routeContext;
	typedEndpoint<EmptyRequest, MissionListResponse>({ requiresSession: true });
	app.post('/v1/mission/get_list', (c) => {
		return withRequestUser(c, routeContext, (user) => {
			const userLiveResult = ensureRouteUserLiveState(
				routeContext,
				user.playerId,
			);
			const userLive = userLiveResult.value;
			const missionSync = routeContext
				.resolveMissionProgress(c, user)
				.syncForMissionList(
					user.playerId,
					routeContext.date.currentGameDate(),
					userLive,
				);
			persistRouteStateIfChanged(
				routeContext,
				userLiveResult.created || missionSync.changed,
			);
			const requestMasterRelease = routeContext.resolveRequestMasterRelease(
				c,
				user,
			);
			const commonRewards = getReceivableCommonMissionRewardsFromDatabase(
				requestMasterRelease.database,
				getCommonMissionStarTotal(missionSync.mission),
				0,
			);
			return c.json(
				createMissionListResponse(
					missionSync.mission,
					missionSync.missionGroups,
					getReceivedCommonMissionOrder(missionSync.mission, commonRewards),
				),
			);
		});
	});
	typedEndpoint<EmptyRequest, CommonMissionRewardResponse>({
		requiresSession: true,
	});
	app.post('/v1/mission/receive_common_mission_reward', (c) => {
		return withRequestUser(c, routeContext, (user) => {
			const userLiveResult = ensureRouteUserLiveState(
				routeContext,
				user.playerId,
			);
			const userLive = userLiveResult.value;
			const missionSync = routeContext
				.resolveMissionProgress(c, user)
				.syncLiveStars(user.playerId, userLive);
			const requestMasterRelease = routeContext.resolveRequestMasterRelease(
				c,
				user,
			);
			const allRewards = getReceivableCommonMissionRewardsFromDatabase(
				requestMasterRelease.database,
				getCommonMissionStarTotal(missionSync.mission),
				0,
			);
			const receivedOrder = getReceivedCommonMissionOrder(
				missionSync.mission,
				allRewards,
			);
			const rewardResult = receiveCommonMissionRewards(
				state,
				user,
				missionSync.mission,
				allRewards.filter((reward) => reward.orderId > receivedOrder),
				createRewardMasterData(requestMasterRelease, routeContext),
				routeContext.resolveUserStatus(c, user),
				requestMasterRelease.masterReleaseId,
				routeContext.date.currentDate().toISOString(),
			);
			persistRouteStateIfChanged(
				routeContext,
				userLiveResult.created ||
					missionSync.changed ||
					rewardResult.receivedCommonMissionIds.length > 0,
			);
			routeContext.applyResponseHeaders(c, defaultHeaders);
			return c.json({
				received_common_mission_ids: rewardResult.receivedCommonMissionIds,
			} satisfies CommonMissionRewardResponse);
		});
	});

	return app;
}
