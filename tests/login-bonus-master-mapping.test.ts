import { describe, expect, test } from 'bun:test';
import {
	createLoginBonusMasterSet,
	getReceivedLoginBonusRewards,
} from '../src/master-data/login-bonus-master-mapping.ts';

describe('login bonus master mapping', () => {
	const rows = [
		{
			id: 20,
			name: '通常ログインボーナス',
			login_bonus_reward_series_id: 200,
			start_time: '2026-01-01T00:00:00Z',
			end_time: '2027-01-01T00:00:00Z',
			row_index: 2,
			login_bonus_kind: 'normal' as const,
		},
		{
			id: 10,
			name: 'イベントログインボーナス',
			login_bonus_reward_series_id: 100,
			start_time: '2026-02-01T00:00:00Z',
			end_time: '2026-03-01T00:00:00Z',
			row_index: 1,
			login_bonus_kind: 'event' as const,
		},
	];
	const rewardsBySeriesId = new Map([
		[
			100,
			[
				{
					login_bonus_reward_series_id: 100,
					day_count: 1,
					reward_type: 3,
					reward_id: 101,
					reward_num: 5,
					reward_name: 'イベント1日目のプレゼントです',
				},
				{
					login_bonus_reward_series_id: 100,
					day_count: 2,
					reward_type: 4,
					reward_id: 102,
					reward_num: 2,
					reward_name: '0 2日目のプレゼントです',
				},
			],
		],
		[
			200,
			[
				{
					login_bonus_reward_series_id: 200,
					day_count: 1,
					reward_type: 1,
					reward_id: 201,
					reward_num: 10,
					reward_name: '通常報酬',
				},
			],
		],
	]);

	test('種別を分離し、同一seriesの先頭日の接頭辞で後続日の報酬名を補正する', () => {
		const masterSet = createLoginBonusMasterSet(rows, rewardsBySeriesId);

		expect(masterSet.eventLoginBonuses).toHaveLength(1);
		expect(masterSet.loginBonuses).toHaveLength(1);
		expect(masterSet.eventLoginBonuses[0]?.datas[1]).toEqual({
			count: 2,
			fileName: '102',
			rewards: [
				{
					amount: 2,
					name: 'イベント2日目のプレゼントです',
					rewardId: 102,
					rewardType: 4,
				},
			],
		});
		expect(masterSet.maxDayCountByLoginBonusId).toEqual(
			new Map([
				[20, 1],
				[10, 2],
			]),
		);
	});

	test('今回受取対象の進捗日だけをevent、normalの順にrewardへ変換する', () => {
		const masterSet = createLoginBonusMasterSet(rows, rewardsBySeriesId);

		expect(
			getReceivedLoginBonusRewards(
				masterSet,
				[
					{ loginBonusId: 10, receivedCount: 2, isReceivedToday: true },
					{ loginBonusId: 20, receivedCount: 1, isReceivedToday: true },
				],
				new Set([10, 20]),
			),
		).toEqual([
			{
				loginBonusId: 10,
				dayCount: 2,
				amount: 2,
				name: 'イベント2日目のプレゼントです',
				rewardId: 102,
				rewardType: 4,
			},
			{
				loginBonusId: 20,
				dayCount: 1,
				amount: 10,
				name: '通常報酬',
				rewardId: 201,
				rewardType: 1,
			},
		]);
	});
});
