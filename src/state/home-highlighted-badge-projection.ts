import type { ActivityRecordMonthlyInfo } from '../master-data/activity-record-master-view.ts';
import { getReceivedCommonMissionOrder } from './mission-common-receipt.ts';
import type { CommonMissionRewardMaster } from './mission-master.ts';
import { getCommonMissionStarTotal } from './mission-star-progress-sync.ts';
import type { UserMissionState } from './mission-types.ts';

export type HomeActivityRecordBadgeProjection = {
	isNotWatchedAdvFromCurrentSeason: boolean;
	isNotDisplayedAdvNewPart: boolean;
};

export function projectHomeActivityRecordBadges(
	monthlyInfoList: readonly ActivityRecordMonthlyInfo[],
): HomeActivityRecordBadgeProjection {
	const currentSeason = monthlyInfoList.find(
		(monthlyInfo) => monthlyInfo.is_current_season,
	);
	return {
		isNotWatchedAdvFromCurrentSeason:
			currentSeason?.is_monthly_not_watched ?? false,
		isNotDisplayedAdvNewPart: currentSeason?.is_not_displayed_new_part ?? false,
	};
}

export function hasUnreceivedCommonMissionReward(
	mission: UserMissionState,
	rewards: readonly CommonMissionRewardMaster[],
): boolean {
	const starTotal = getCommonMissionStarTotal(mission);
	const receivedOrder = getReceivedCommonMissionOrder(mission, rewards);
	return rewards.some(
		(reward) =>
			reward.clearConditionNum <= starTotal && reward.orderId > receivedOrder,
	);
}
