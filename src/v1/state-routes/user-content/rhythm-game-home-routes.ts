import { Hono } from 'hono';
import { runRewardClaimMutation } from '../../../application/reward-claim-service.ts';
import { projectUserCards } from '../../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../../master-data/user-owned-master-support.ts';
import {
	applyUserReward,
	canApplyUserRewards,
} from '../../../state/reward-state.ts';
import { ensureUserCards } from '../../../state/user-card-aggregate-state.ts';
import { receiveRhythmGameClassMission } from '../../active-master-database/rhythm-game-class-mission-responses.ts';
import { getRhythmGameHome } from '../../active-master-database/rhythm-game-home-responses.ts';
import { readJson } from '../../http/read-json.ts';
import type {
	RhythmGameReceiveClassMissionRequest,
	RhythmGameReceiveClassMissionResponse,
} from '../../response-types/app-content-response-types.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type { RhythmGameHomeResponse } from '../../response-types/rhythm-game-live-response-types.ts';
import { createCardMemberFanLevelsForResponse } from '../../responses/card-member-fan-levels.ts';
import { createQuestLiveFriendCardList } from '../../responses/quest-friend-card-response.ts';
import { createUserCardDataListWithMemberFanLevels } from '../../responses/user-card-response.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../../route-support/endpoint-source.ts';
import { createFanLevelList } from '../../route-support/fan-level-response-mapper.ts';
import { ensureRouteUserLiveState } from '../../route-support/request-user-state.ts';
import { createRewardMasterData } from '../../route-support/reward-master-data.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
export function createRhythmGameHomeRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state, userCardGetList } =
		routeContext;
	typedEndpoint<EmptyRequest, RhythmGameHomeResponse>({
		requiresSession: true,
	});
	app.post('/v1/rhythm_game/home', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLiveResult = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		);
		const userLive = userLiveResult.value;
		const cardsResult = ensureUserCards(state, user.playerId, userCardGetList);
		const cards = cardsResult.value;
		const database = routeContext.resolveMasterDatabase(c, user);
		const support = createUserOwnedMasterSupport(database);
		const visibleCards = projectUserCards(cards, support);
		const userStatus = routeContext.resolveUserStatus(c, user);
		const statusResult = userStatus.ensure(state, user.playerId);
		const status = statusResult.value;
		persistRouteStateIfChanged(
			routeContext,
			userLiveResult.created || cardsResult.created || statusResult.created,
		);
		return respondStored(
			c,
			defaultHeaders,
			getRhythmGameHome(
				database,
				createUserCardDataListWithMemberFanLevels(
					visibleCards,
					createCardMemberFanLevelsForResponse(userStatus, status),
				),
				userLive,
				createFanLevelList(userStatus.getCurrentSeasonMemberFanLevels(status)),
				routeContext.date.nextGameDateBoundaryIsoDateTime(),
				createQuestLiveFriendCardList(
					{
						requestPlayerId: user.playerId,
						friendCardSlot: 'rhythmGame',
						followRelations: state.followRelations,
						registeredUsers: state.registeredUsers,
						userCards: state.userCards,
						userFriendCards: state.userFriendCards,
						userProfileDesigns: state.userProfileDesigns,
						userSocials: state.userSocials,
						userStatuses: state.userStatuses,
					},
					userStatus,
					support,
				),
				new Set(
					visibleCards.userCardDataList.map((card) => card.d_card_datas_id),
				),
			),
		);
	});
	apkDumpTypedEndpoint<
		RhythmGameReceiveClassMissionRequest,
		RhythmGameReceiveClassMissionResponse
	>();
	app.post('/v1/rhythm_game/receive_class_mission', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLive = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		).value;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const body = await readJson(c.req.raw);
		const result = runRewardClaimMutation(state, () => {
			const received = receiveRhythmGameClassMission(
				body,
				userLive,
				masterRelease.database,
			);
			if (!received) return undefined;
			const rewardMasterData = createRewardMasterData(
				masterRelease,
				routeContext,
			);
			const rewards = received.rewards.map((reward) => ({
				itemId: reward.rewardItemId,
				itemType: reward.rewardType,
				amount: reward.rewardNum,
			}));
			if (!canApplyUserRewards(state, user, rewards, rewardMasterData)) {
				throw new Error('rhythm game class mission rewards are incompatible');
			}
			for (const reward of rewards) {
				applyUserReward(
					state,
					user,
					reward,
					rewardMasterData,
					routeContext.resolveUserStatus(c, user),
					'rhythm_game_receive_class_mission',
				);
			}
			return received;
		});
		if (!result) {
			return routeContext.respondError(c, 'rhythmGameClassMissionInvalid');
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, result.response);
	});

	return app;
}
