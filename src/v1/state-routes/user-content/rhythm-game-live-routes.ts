import { Hono } from 'hono';
import { projectCompatibleMusicProgresses } from '../../../application/music-progress-projection.ts';
import { runRewardClaimMutation } from '../../../application/reward-claim-service.ts';
import { getMusicIdentityFingerprints } from '../../../master-data/entity-identity-fingerprints.ts';
import {
	calculateRhythmGameMusicMasteryExperience,
	createRhythmGameDropRewards,
	getActiveRhythmGameCampaignTypes,
	getRhythmGameStaminaCost,
} from '../../../master-data/rhythm-game-rewards.ts';
import {
	applyUserReward,
	canApplyUserRewards,
} from '../../../state/reward-state.ts';
import { consumeUserStamina } from '../../../state/user-status-stamina.ts';
import {
	setRhythmGameFinish,
	setRhythmGameStart,
} from '../../active-master-database/rhythm-game-live-responses.ts';
import { readJson } from '../../http/read-json.ts';
import type {
	RhythmGameFinishRequest,
	RhythmGameFinishResponse,
	RhythmGameStartRequest,
	RhythmGameStartResponse,
} from '../../response-types/rhythm-game-live-response-types.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { resolveMasterReleaseBoundSessionDatabase } from '../../route-support/master-release-bound-session.ts';
import { isJsonRecord } from '../../route-support/request-fields.ts';
import { ensureRouteUserLiveState } from '../../route-support/request-user-state.ts';
import { createRewardMasterData } from '../../route-support/reward-master-data.ts';
import {
	getRequestUser,
	persistRouteState,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
export function createRhythmGameLiveRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state } = routeContext;
	typedEndpoint<RhythmGameStartRequest, RhythmGameStartResponse>({
		requiresSession: true,
	});
	app.post('/v1/rhythm_game_live/set_start', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLive = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		).value;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const response = setRhythmGameStart(
			await readJson(c.req.raw),
			userLive,
			masterRelease.masterReleaseId,
		);
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});
	typedEndpoint<RhythmGameFinishRequest, RhythmGameFinishResponse>({
		requiresSession: true,
	});
	app.post('/v1/rhythm_game_live/set_finish', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLive = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		).value;
		const currentRhythmGame = userLive.currentRhythmGame;
		const body = await readJson(c.req.raw);
		if (
			!isJsonRecord(body) ||
			currentRhythmGame === null ||
			currentRhythmGame.consumeStaminaMagnification === undefined
		) {
			return routeContext.respondError(c, 'rhythmGameNotStarted');
		}
		const consumeStaminaMagnification =
			currentRhythmGame.consumeStaminaMagnification;
		const now = routeContext.date.currentDate().toISOString();
		const database = resolveMasterReleaseBoundSessionDatabase(
			c,
			routeContext,
			currentRhythmGame,
		);
		if (database instanceof Response) {
			return database;
		}
		const sourceMasterReleaseId = currentRhythmGame.masterReleaseId;
		if (sourceMasterReleaseId === undefined) {
			return routeContext.respondError(c, 'sessionMasterReleaseUnavailable');
		}
		const dropRewards = createRhythmGameDropRewards({
			database,
			musicId: currentRhythmGame.musicId,
			difficulty: currentRhythmGame.difficulty,
			magnification: consumeStaminaMagnification,
			now,
			random: Math.random,
		}).map((reward) => ({
			reward_type: reward.rewardType,
			reward_item_id: reward.rewardItemId,
			reward_num: reward.rewardNum,
		}));
		const rewardMasterData = createRewardMasterData(
			{ database, masterReleaseId: sourceMasterReleaseId },
			routeContext,
		);
		const rewards = dropRewards.map((reward) => ({
			itemId: reward.reward_item_id,
			itemType: reward.reward_type,
			amount: reward.reward_num,
		}));
		if (!canApplyUserRewards(state, user, rewards, rewardMasterData)) {
			throw new Error('rhythm game finish rewards are incompatible');
		}
		const insufficientStamina = Symbol('insufficientStamina');
		const invalidFinish = Symbol('invalidFinish');
		let response: ReturnType<typeof setRhythmGameFinish>;
		try {
			response = runRewardClaimMutation(state, () => {
				const consumed = consumeUserStamina(
					routeContext.resolveUserStatus(c, user).ensure(state, user.playerId)
						.value,
					getRhythmGameStaminaCost(consumeStaminaMagnification),
					routeContext.date.currentDate(),
				);
				if (!consumed) throw insufficientStamina;
				const finishResponse = setRhythmGameFinish(
					database,
					sourceMasterReleaseId,
					body,
					userLive,
					routeContext.date.nextGameDateBoundaryIsoDateTime(),
					dropRewards,
					calculateRhythmGameMusicMasteryExperience({
						database,
						musicId: currentRhythmGame.musicId,
						difficulty: currentRhythmGame.difficulty,
						magnification: consumeStaminaMagnification,
						now,
					}),
					getActiveRhythmGameCampaignTypes(database, now),
				);
				if (!finishResponse) throw invalidFinish;
				routeContext.resolveMissionProgress(c, user).apply({
					type: 'rhythmGameClear',
					playerId: user.playerId,
					userLive: {
						...userLive,
						rhythmMusicScores: projectCompatibleMusicProgresses(
							userLive.rhythmMusicScores,
							getMusicIdentityFingerprints(database),
						),
					},
				});
				for (const reward of rewards) {
					applyUserReward(
						state,
						user,
						reward,
						rewardMasterData,
						routeContext.resolveUserStatus(c, user),
						'rhythm_game_live_set_finish',
					);
				}
				return finishResponse;
			});
		} catch (error) {
			if (error === insufficientStamina) {
				return routeContext.respondError(c, 'playPointInsufficient');
			}
			if (error === invalidFinish) {
				return routeContext.respondError(c, 'rhythmGameNotStarted');
			}
			throw error;
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	return app;
}
