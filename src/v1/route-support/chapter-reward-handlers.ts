import type { Context } from 'hono';
import {
	appendRewardClaims,
	runRewardClaimMutation,
} from '../../application/reward-claim-service.ts';
import {
	getChapterPointRewardsFromDatabase,
	getChapterRankFromDatabase,
	getChapterRewardIconFrameIdsBetweenRanksFromDatabase,
} from '../../master-data/chapter-master-data.ts';
import { claimChapterPointRewards } from '../../state/chapter-reward-claim-state.ts';
import { applyUserReward } from '../../state/reward-state.ts';
import {
	ensureUserInventory,
	findUserItemByItemId,
} from '../../state/user-inventory-aggregate.ts';
import { readJson } from '../http/read-json.ts';
import { createChapterPointRewardsResponse } from '../responses/chapter-response.ts';
import { getChapterClaimMasterReleaseSession } from './chapter-master-release-session.ts';
import { readChapterClaimRequest } from './chapter-request.ts';
import { getRequestUserChapterState } from './request-user-state.ts';
import { createRewardMasterData } from './reward-master-data.ts';
import {
	persistRouteState,
	persistRouteStateIfChanged,
} from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createChapterPointRewardsHandler(
	routeContext: StateRouteContext,
) {
	return (c: Context) => {
		const result = getRequestUserChapterState(c, routeContext);
		if (result instanceof Response) return result;
		persistRouteStateIfChanged(routeContext, result.created);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(
			createChapterPointRewardsResponse(
				result.value,
				getChapterPointRewardsFromDatabase(
					result.database,
					result.value.chapterId,
					new Map(),
				),
			),
		);
	};
}

export function createChapterClaimRewardsHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const session = getChapterClaimMasterReleaseSession(c, routeContext);
		if (session instanceof Response) return session;
		const { currentPoint } = readChapterClaimRequest(await readJson(c.req.raw));
		const rewards = getChapterPointRewardsFromDatabase(
			session.database,
			session.chapter.chapterId,
			new Map(),
		);
		const previousRank = getChapterRankFromDatabase(
			session.database,
			session.chapter.currentPoint,
		).currentRank;
		const rewardMasterData = createRewardMasterData(
			{ database: session.database, masterReleaseId: session.masterReleaseId },
			routeContext,
		);
		runRewardClaimMutation(routeContext.state, () => {
			const result = claimChapterPointRewards(
				session.chapter,
				rewards,
				currentPoint,
				session.master.categoryPoints,
			);
			const acceptedIds = new Set(
				appendRewardClaims(
					routeContext.state,
					result.claimedRewardIds.map((rewardId) => ({
						playerId: session.user.playerId,
						claimKind: 'chapter-point' as const,
						stableClaimId: String(rewardId),
						periodKey: `chapter:${session.chapter.chapterId}:${session.provenance.identityFingerprint.value}`,
						sourceMasterReleaseId: session.masterReleaseId,
						definitionMasterReleaseId: session.masterReleaseId,
						grantedAt: routeContext.date.currentDate().toISOString(),
					})),
				).map((claim) => claim.stableClaimId),
			);
			for (const reward of rewards) {
				if (!acceptedIds.has(String(reward.chapter_point_rewards_id))) continue;
				for (const data of reward.reward_datas)
					applyUserReward(
						routeContext.state,
						session.user,
						{
							itemId: data.item_id,
							itemType: data.item_type,
							amount: data.num,
						},
						rewardMasterData,
						routeContext.resolveUserStatus(c, session.user),
						'chapter point',
					);
			}
			const inventory = ensureUserInventory(
				routeContext.state,
				session.user.playerId,
				routeContext.userItemsGetList,
			).value;
			const currentRank = getChapterRankFromDatabase(
				session.database,
				session.chapter.currentPoint,
			).currentRank;
			for (const iconFrameId of getChapterRewardIconFrameIdsBetweenRanksFromDatabase(
				session.database,
				previousRank,
				currentRank,
			)) {
				if (findUserItemByItemId(inventory, iconFrameId)) continue;
				applyUserReward(
					routeContext.state,
					session.user,
					{ itemId: iconFrameId, itemType: 10, amount: 1 },
					rewardMasterData,
					routeContext.resolveUserStatus(c, session.user),
					'chapter rank icon frame',
				);
			}
		});
		persistRouteState(routeContext);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(createChapterPointRewardsResponse(session.chapter, rewards));
	};
}
