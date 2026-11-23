import { isSameEntityIdentity } from './entity-provenance.ts';
import type { CommonMissionRewardMaster } from './mission-master.ts';
import type { UserMissionState } from './mission-types.ts';

export function getReceivedCommonMissionOrder(
	mission: UserMissionState,
	rewards: readonly CommonMissionRewardMaster[],
): number {
	if (mission.commonMissionInfo.receivedOrder > 0) {
		return mission.commonMissionInfo.receivedOrder;
	}
	return (mission.commonMissionInfo.receivedRewards ?? []).reduce(
		(max, received) => {
			const compatible = rewards.some(
				(reward) =>
					reward.commonMissionId === received.commonMissionId &&
					reward.identityFingerprint !== undefined &&
					isSameEntityIdentity(
						received.identityFingerprint,
						reward.identityFingerprint,
					),
			);
			return compatible ? Math.max(max, received.orderId) : max;
		},
		0,
	);
}

export function recordReceivedCommonMissionRewards(
	mission: UserMissionState,
	rewards: readonly CommonMissionRewardMaster[],
	sourceMasterReleaseId: string,
): void {
	for (const reward of rewards) {
		const identityFingerprint = reward.identityFingerprint;
		if (identityFingerprint === undefined) {
			setReceivedCommonMissionOrder(mission, reward.orderId);
			continue;
		}
		const exists = (mission.commonMissionInfo.receivedRewards ?? []).some(
			(received) =>
				received.commonMissionId === reward.commonMissionId &&
				isSameEntityIdentity(received.identityFingerprint, identityFingerprint),
		);
		if (!exists) {
			mission.commonMissionInfo.receivedRewards = [
				...(mission.commonMissionInfo.receivedRewards ?? []),
				{
					commonMissionId: reward.commonMissionId,
					orderId: reward.orderId,
					sourceMasterReleaseId,
					identityFingerprint,
				},
			];
		}
	}
}

function setReceivedCommonMissionOrder(
	mission: UserMissionState,
	receivedOrder: number,
): boolean {
	if (!Number.isSafeInteger(receivedOrder) || receivedOrder < 0) return false;
	if (receivedOrder <= mission.commonMissionInfo.receivedOrder) return false;
	mission.commonMissionInfo.receivedOrder = receivedOrder;
	return true;
}
