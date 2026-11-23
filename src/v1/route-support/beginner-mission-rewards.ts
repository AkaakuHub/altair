import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import { getBeginnerMissionRewardsFromDatabase } from '../../master-data/beginner-mission-master-data.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import type { EntityIdentityFingerprint } from '../../state/entity-provenance.ts';
import { applyUserReward } from '../../state/reward-state.ts';
import { createRewardMasterData } from './reward-master-data.ts';
import type { StateRouteContext } from './state-route-context.ts';

export class BeginnerMissionRewardUnavailableError extends Error {}

export function createBeginnerMissionClaim(
	playerId: string,
	missionId: number,
	masterReleaseId: string,
	grantedAt: string,
	identityFingerprint?: EntityIdentityFingerprint,
) {
	return {
		playerId,
		claimKind: 'beginner-mission' as const,
		stableClaimId: String(missionId),
		periodKey:
			identityFingerprint === undefined
				? 'lifetime'
				: `definition:${identityFingerprint.value}`,
		sourceMasterReleaseId: masterReleaseId,
		definitionMasterReleaseId: masterReleaseId,
		grantedAt,
	};
}

export function hasBeginnerMissionRewardsForMission(
	database: Database,
	missionId: number,
): boolean {
	return getBeginnerMissionRewardsFromDatabase(database).has(missionId);
}

export function applyBeginnerMissionRewards(
	c: Context,
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	missionIds: readonly number[],
	database: Database,
	masterReleaseId: string,
): boolean {
	const rewardsByMissionId = getBeginnerMissionRewardsFromDatabase(database);
	if (missionIds.some((missionId) => !rewardsByMissionId.has(missionId))) {
		return false;
	}
	const rewardMasterData = createRewardMasterData(
		{ database, masterReleaseId },
		routeContext,
	);
	for (const missionId of missionIds) {
		const rewards = rewardsByMissionId.get(missionId);
		if (rewards === undefined) {
			throw new Error(`Beginner mission rewards are missing: ${missionId}`);
		}
		for (const reward of rewards) {
			applyUserReward(
				routeContext.state,
				user,
				reward,
				rewardMasterData,
				routeContext.resolveUserStatus(c, user),
				`beginner mission ${missionId}`,
			);
		}
	}
	return true;
}
