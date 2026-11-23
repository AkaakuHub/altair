import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import { recordReceivedCommonMissionRewards } from '../state/mission-common-receipt.ts';
import type { CommonMissionRewardMaster } from '../state/mission-master.ts';
import { getCommonMissionStarTotal } from '../state/mission-star-progress-sync.ts';
import type { UserMissionState } from '../state/mission-types.ts';
import { hasRewardClaim } from '../state/reward-claim-ledger-state.ts';
import {
	applyUserReward,
	type RewardMasterData,
} from '../state/reward-state.ts';
import type { UserStatusAccess } from '../state/user-status-port.ts';
import { applyRewardClaims } from './reward-claim-service.ts';

type CommonMissionRewardReceiveResult = {
	receivedCommonMissionIds: number[];
};

export function receiveCommonMissionRewards(
	state: ServerState,
	user: RegisteredUserState,
	mission: UserMissionState,
	rewards: readonly CommonMissionRewardMaster[],
	masterData: RewardMasterData,
	userStatus: UserStatusAccess,
	masterReleaseId: string,
	grantedAt: string,
): CommonMissionRewardReceiveResult {
	const starTotal = getCommonMissionStarTotal(mission);
	const receivableRewards = rewards.filter(
		(reward) => reward.clearConditionNum <= starTotal,
	);
	const claimableRewards = receivableRewards.filter(
		(reward) =>
			!hasRewardClaim(state.rewardClaims, {
				playerId: user.playerId,
				claimKind: 'common-mission',
				stableClaimId: String(reward.commonMissionId),
				periodKey: 'lifetime',
			}),
	);
	const rewardByClaimId = new Map(
		claimableRewards.map((reward) => [String(reward.commonMissionId), reward]),
	);
	const acceptedClaims = applyRewardClaims(
		state,
		claimableRewards.map((reward) => ({
			playerId: user.playerId,
			claimKind: 'common-mission',
			stableClaimId: String(reward.commonMissionId),
			periodKey:
				reward.identityFingerprint === undefined
					? 'lifetime'
					: `definition:${reward.identityFingerprint.value}`,
			sourceMasterReleaseId: masterReleaseId,
			definitionMasterReleaseId: masterReleaseId,
			grantedAt,
		})),
		(claims) => {
			for (const claim of claims) {
				const reward = rewardByClaimId.get(claim.stableClaimId);
				if (reward === undefined) {
					throw new Error(
						`Common mission reward is missing: ${claim.stableClaimId}`,
					);
				}
				applyUserReward(
					state,
					user,
					{
						itemId: reward.reward.itemId,
						itemType: reward.reward.itemType,
						amount: reward.reward.amount,
					},
					masterData,
					userStatus,
					`common mission ${reward.commonMissionId}`,
				);
			}
		},
	);
	const receivedCommonMissionIds = acceptedClaims.map((claim) =>
		Number.parseInt(claim.stableClaimId, 10),
	);
	recordReceivedCommonMissionRewards(
		mission,
		receivableRewards,
		masterReleaseId,
	);
	return {
		receivedCommonMissionIds,
	};
}
