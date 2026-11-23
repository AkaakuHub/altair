import type { Context } from 'hono';
import { appendRewardClaims } from '../../application/reward-claim-service.ts';
import { getBeginnerMissionCategoriesFromDatabase } from '../../master-data/beginner-mission-master-data.ts';
import { receiveBeginnerMissionReward } from '../../state/beginner-mission-reward-state.ts';
import { readJson } from '../http/read-json.ts';
import {
	completeBeginnerMissionRewardMutation,
	runBeginnerMissionRewardMutation,
} from './beginner-mission-handler-support.ts';
import { readBeginnerMissionId } from './beginner-mission-request.ts';
import {
	applyBeginnerMissionRewards,
	BeginnerMissionRewardUnavailableError,
	createBeginnerMissionClaim,
	hasBeginnerMissionRewardsForMission,
} from './beginner-mission-rewards.ts';
import { getRequestUserBeginnerMissionSession } from './request-user-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createBeginnerMissionSetRewardHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const body = await readJson(c.req.raw);
		const missionId = readBeginnerMissionId(body);
		const session = getRequestUserBeginnerMissionSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		if (
			missionId === undefined ||
			!hasBeginnerMissionRewardsForMission(session.database, missionId)
		) {
			return routeContext.respondError(c, 'beginnerMissionRewardSeedNotFound');
		}
		const masterMission = getBeginnerMissionCategoriesFromDatabase(
			session.database,
		)
			.flatMap((category) => category.missionList)
			.find((mission) => mission.missionId === missionId);
		if (masterMission === undefined) {
			return routeContext.respondError(c, 'beginnerMissionRewardSeedNotFound');
		}
		const result = runBeginnerMissionRewardMutation(
			c,
			routeContext,
			routeContext.state,
			() => {
				const receivedMissionId = receiveBeginnerMissionReward(
					session.mission,
					missionId,
					masterMission.identityFingerprint,
				);
				if (receivedMissionId === undefined) {
					throw new BeginnerMissionRewardUnavailableError();
				}
				const acceptedClaims = appendRewardClaims(routeContext.state, [
					createBeginnerMissionClaim(
						session.user.playerId,
						receivedMissionId,
						session.masterReleaseId,
						routeContext.date.currentDate().toISOString(),
						masterMission.identityFingerprint,
					),
				]);
				if (
					!applyBeginnerMissionRewards(
						c,
						routeContext,
						session.user,
						acceptedClaims.map((claim) =>
							Number.parseInt(claim.stableClaimId, 10),
						),
						session.database,
						session.masterReleaseId,
					)
				) {
					throw new BeginnerMissionRewardUnavailableError();
				}
			},
		);
		if (!result.succeeded) {
			return result.response;
		}
		completeBeginnerMissionRewardMutation(c, routeContext);
		return c.json(null);
	};
}
