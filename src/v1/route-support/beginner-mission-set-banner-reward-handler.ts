import type { Context } from 'hono';
import { appendRewardClaims } from '../../application/reward-claim-service.ts';
import {
	getBeginnerMissionBannerRewardsFromDatabase,
	getBeginnerMissionCategoriesFromDatabase,
} from '../../master-data/beginner-mission-master-data.ts';
import { receiveBeginnerMissionBannerReward } from '../../state/beginner-mission-reward-state.ts';
import { applyUserReward } from '../../state/reward-state.ts';
import { readJson } from '../http/read-json.ts';
import {
	completeBeginnerMissionRewardMutation,
	runBeginnerMissionRewardMutation,
} from './beginner-mission-handler-support.ts';
import { readBeginnerMissionType } from './beginner-mission-request.ts';
import { BeginnerMissionRewardUnavailableError } from './beginner-mission-rewards.ts';
import { getRequestUserBeginnerMissionSession } from './request-user-state.ts';
import { createRewardMasterData } from './reward-master-data.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createBeginnerMissionSetBannerRewardHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const body = await readJson(c.req.raw);
		const missionType = readBeginnerMissionType(body);
		const session = getRequestUserBeginnerMissionSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		const missionCategories = getBeginnerMissionCategoriesFromDatabase(
			session.database,
		);
		const rewardsByMissionType = getBeginnerMissionBannerRewardsFromDatabase(
			session.database,
		);
		const reward =
			missionType === undefined
				? undefined
				: rewardsByMissionType.get(missionType);
		if (!reward || missionType === undefined) {
			return routeContext.respondError(c, 'beginnerMissionRewardSeedNotFound');
		}
		const result = runBeginnerMissionRewardMutation(
			c,
			routeContext,
			routeContext.state,
			() => {
				const receivedMissionType = receiveBeginnerMissionBannerReward(
					session.mission,
					missionType,
					missionCategories,
					session.masterReleaseId,
				);
				if (receivedMissionType === undefined) {
					throw new BeginnerMissionRewardUnavailableError();
				}
				const acceptedClaims = appendRewardClaims(routeContext.state, [
					{
						playerId: session.user.playerId,
						claimKind: 'beginner-mission-banner',
						stableClaimId: String(receivedMissionType),
						periodKey: `definition:${
							missionCategories.find(
								(category) => category.missionType === receivedMissionType,
							)?.identityFingerprint?.value ?? 'legacy'
						}`,
						sourceMasterReleaseId: session.masterReleaseId,
						definitionMasterReleaseId: session.masterReleaseId,
						grantedAt: routeContext.date.currentDate().toISOString(),
					},
				]);
				if (acceptedClaims.length === 0) {
					return;
				}
				applyUserReward(
					routeContext.state,
					session.user,
					reward,
					createRewardMasterData(
						{
							database: session.database,
							masterReleaseId: session.masterReleaseId,
						},
						routeContext,
					),
					routeContext.resolveUserStatus(c, session.user),
					`beginner mission banner ${receivedMissionType}`,
				);
			},
		);
		if (!result.succeeded) {
			return result.response;
		}
		completeBeginnerMissionRewardMutation(c, routeContext);
		return c.json(null);
	};
}
