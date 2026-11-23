import { describe, expect, test } from 'bun:test';
import type { ActivityRecordAdvRow } from '../src/master-data/activity-record-master-queries.ts';
import {
	createActivityRecordMonthlyInfoList,
	createActivityRecordWatchRewardList,
} from '../src/master-data/activity-record-master-view.ts';

const createAdvRow = (
	overrides: Partial<ActivityRecordAdvRow> = {},
): ActivityRecordAdvRow => ({
	id: 101,
	adv_series_id: 10,
	name: '第1話',
	description: '説明',
	open_season_fan_level: 2,
	reward_type: '1,2',
	watch_reward_id: '1001,1002',
	watch_reward_num: '3,4',
	order_id: 1,
	sub_title_name: '副題',
	adv_unlock_item_id: 500,
	adv_unlock_item_num: 1,
	adv_unlock_condition_value: 100,
	...overrides,
});

describe('activity record master view', () => {
	test('master releaseから取得した行とユーザー状態を公式表示へ変換する', () => {
		const result = createActivityRecordMonthlyInfoList(
			[
				{
					id: 10,
					name: '2026年7月',
					description: '月間説明',
					start_time: '2026-07-01T00:00:00+00:00',
					end_time: '2026-08-01T00:00:00+00:00',
					is_badge_display_type: 1,
				},
			],
			[createAdvRow()],
			10,
			new Set([100]),
			new Set(),
			new Set(),
			new Map([[500, 2]]),
		);

		expect(result).toEqual([
			{
				adv_series_id: 10,
				monthly_title: '2026年7月',
				monthly_description: '月間説明',
				is_monthly_not_watched: true,
				is_current_season: true,
				monthly_start_date: '2026-07-01T00:00:00Z',
				monthly_end_date: '2026-08-01T00:00:00Z',
				adv_info_list: [
					{
						adv_data_id: 101,
						title: '第1話',
						order_id: 1,
						subtitle: '副題',
						description: '説明',
						watchable_status: 6,
						is_not_watched: true,
						open_season_fan_level: 2,
						watch_reward_list: [
							{
								watch_reward_type: 1,
								watch_reward_id: 1001,
								watch_reward_num: 3,
							},
							{
								watch_reward_type: 2,
								watch_reward_id: 1002,
								watch_reward_num: 4,
							},
						],
						adv_unlock_item_num: 2,
					},
				],
				is_not_displayed_new_part: true,
			},
		]);
	});

	test('報酬列の個数が一致しない場合は報酬を返さない', () => {
		expect(
			createActivityRecordWatchRewardList(
				createAdvRow({ watch_reward_num: '3' }),
			),
		).toEqual([]);
	});

	test('current seriesに指定されていないseriesはcurrent seasonにしない', () => {
		const result = createActivityRecordMonthlyInfoList(
			[
				{
					id: 10,
					name: '2026年7月',
					description: '月間説明',
					start_time: '2026-07-01T00:00:00+00:00',
					end_time: '2026-08-01T00:00:00+00:00',
					is_badge_display_type: 1,
				},
			],
			[createAdvRow()],
			null,
			new Set(),
			new Set(),
			new Set(),
			new Map(),
		);

		expect(result[0]?.is_current_season).toBe(false);
	});
});
