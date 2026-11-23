import type { Context } from 'hono';
import { appendRewardClaims } from '../../application/reward-claim-service.ts';
import { getBeginnerMissionCategoriesFromDatabase } from '../../master-data/beginner-mission-master-data.ts';
import { receiveBeginnerMissionRewards } from '../../state/beginner-mission-reward-state.ts';
import { readJson } from '../http/read-json.ts';
import {
	completeBeginnerMissionRewardMutation,
	runBeginnerMissionRewardMutation,
} from './beginner-mission-handler-support.ts';
import { readBeginnerMissionType } from './beginner-mission-request.ts';
import {
	applyBeginnerMissionRewards,
	BeginnerMissionRewardUnavailableError,
	createBeginnerMissionClaim,
} from './beginner-mission-rewards.ts';
import { getRequestUserBeginnerMissionSession } from './request-user-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createBeginnerMissionSetRewardAllHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const body = await readJson(c.req.raw);
		const missionType = readBeginnerMissionType(body);
		const session = getRequestUserBeginnerMissionSession(c, routeContext);
		if (session instanceof Response) {
			return session;
		}
		if (missionType === undefined) {
			return routeContext.respondError(c, 'beginnerMissionRewardSeedNotFound');
		}
		const missionCategories = getBeginnerMissionCategoriesFromDatabase(
			session.database,
		);
		if (
			!missionCategories.some(
				(category) => category.missionType === missionType,
			)
		) {
			return routeContext.respondError(c, 'beginnerMissionRewardSeedNotFound');
		}
		const result = runBeginnerMissionRewardMutation(
			c,
			routeContext,
			routeContext.state,
			() => {
				const received = receiveBeginnerMissionRewards(
					session.mission,
					missionType,
					missionCategories,
				);
				if (received === undefined) {
					throw new BeginnerMissionRewardUnavailableError();
				}
				const acceptedClaims = appendRewardClaims(
					routeContext.state,
					received.mission_id_list.map((missionId) =>
						createBeginnerMissionClaim(
							session.user.playerId,
							missionId,
							session.masterReleaseId,
							routeContext.date.currentDate().toISOString(),
							missionCategories
								.flatMap((category) => category.missionList)
								.find((mission) => mission.missionId === missionId)
								?.identityFingerprint,
						),
					),
				);
				const acceptedMissionIds = acceptedClaims.map((claim) =>
					Number.parseInt(claim.stableClaimId, 10),
				);
				if (
					!applyBeginnerMissionRewards(
						c,
						routeContext,
						session.user,
						acceptedMissionIds,
						session.database,
						session.masterReleaseId,
					)
				) {
					throw new BeginnerMissionRewardUnavailableError();
				}
				return received;
			},
		);
		if (!result.succeeded) {
			return result.response;
		}
		completeBeginnerMissionRewardMutation(c, routeContext);
		return c.json(result.value);
	};
}
