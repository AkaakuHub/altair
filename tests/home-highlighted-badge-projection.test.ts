import { describe, expect, test } from 'bun:test';
import type { ActivityRecordMonthlyInfo } from '../src/master-data/activity-record-master-view.ts';
import {
	hasUnreceivedCommonMissionReward,
	projectHomeActivityRecordBadges,
} from '../src/state/home-highlighted-badge-projection.ts';
import type { CommonMissionRewardMaster } from '../src/state/mission-master.ts';
import type { UserMissionState } from '../src/state/mission-types.ts';

describe('home highlighted badge projection', () => {
	test('current seasonのADV未視聴とnew part未表示を投影する', () => {
		const previousSeason = monthlyInfo({
			isCurrentSeason: false,
			isMonthlyNotWatched: true,
			isNotDisplayedNewPart: true,
		});
		const currentSeason = monthlyInfo({
			isCurrentSeason: true,
			isMonthlyNotWatched: false,
			isNotDisplayedNewPart: true,
		});

		expect(
			projectHomeActivityRecordBadges([previousSeason, currentSeason]),
		).toEqual({
			isNotWatchedAdvFromCurrentSeason: false,
			isNotDisplayedAdvNewPart: true,
		});
	});

	test('current seasonがない場合はADV badgeを表示しない', () => {
		expect(projectHomeActivityRecordBadges([])).toEqual({
			isNotWatchedAdvFromCurrentSeason: false,
			isNotDisplayedAdvNewPart: false,
		});
	});

	test('達成済みで未受取のcommon mission報酬を検出する', () => {
		const mission = userMission({ starTotal: 20, receivedOrder: 1 });

		expect(
			hasUnreceivedCommonMissionReward(mission, [
				commonMissionReward({ clearConditionNum: 10, orderId: 1 }),
				commonMissionReward({ clearConditionNum: 20, orderId: 2 }),
			]),
		).toBe(true);
	});

	test('未達成または受取済みのcommon mission報酬だけならfalseを返す', () => {
		const mission = userMission({ starTotal: 20, receivedOrder: 2 });

		expect(
			hasUnreceivedCommonMissionReward(mission, [
				commonMissionReward({ clearConditionNum: 20, orderId: 2 }),
				commonMissionReward({ clearConditionNum: 30, orderId: 3 }),
			]),
		).toBe(false);
	});
});

function monthlyInfo(input: {
	isCurrentSeason: boolean;
	isMonthlyNotWatched: boolean;
	isNotDisplayedNewPart: boolean;
}): ActivityRecordMonthlyInfo {
	return {
		adv_series_id: 1,
		monthly_title: '',
		monthly_description: '',
		is_monthly_not_watched: input.isMonthlyNotWatched,
		is_current_season: input.isCurrentSeason,
		monthly_start_date: '2026-01-01T00:00:00Z',
		monthly_end_date: '2026-02-01T00:00:00Z',
		adv_info_list: [],
		is_not_displayed_new_part: input.isNotDisplayedNewPart,
	};
}

function userMission(input: {
	starTotal: number;
	receivedOrder: number;
}): UserMissionState {
	return {
		playerId: 'player',
		commonMissionInfo: {
			receivedOrder: input.receivedOrder,
			rhythmGameStar: 0,
			schoolStageStar: input.starTotal,
		},
		missionProgresses: [],
		dailyMissionGameDate: null,
	};
}

function commonMissionReward(input: {
	clearConditionNum: number;
	orderId: number;
}): CommonMissionRewardMaster {
	return {
		commonMissionId: input.orderId,
		clearConditionNum: input.clearConditionNum,
		orderId: input.orderId,
		reward: { itemType: 1, itemId: 1, amount: 1 },
	};
}
