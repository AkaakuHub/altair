import { describe, expect, test } from 'bun:test';
import { createFanLevelInfo } from '../src/v1/responses/profile-fan-level-mapper.ts';

describe('createFanLevelInfo', () => {
	test('canonical member stateと履歴を公式response fieldへ写像する', () => {
		expect(
			createFanLevelInfo(
				{
					characterId: 3,
					dSeasonFanLevel: 4,
					dSeasonFanExperience: 5,
					memberFanLevel: 6,
					memberFanExperience: 7,
				},
				[
					{
						characterId: 3,
						earnType: 2,
						totalPoint: 8,
						seasonPointHistoryList: [
							{
								seasonId: 9,
								pointHistoryList: [
									{ date: 'date', message: 'message', point: 10 },
								],
							},
						],
					},
				],
			),
		).toEqual({
			character_id: 3,
			d_season_fan_level: 4,
			d_season_fan_experience: 5,
			member_fan_level: 6,
			member_fan_experience: 7,
			earn_progress_list: [
				{
					earn_type: 2,
					total_point: 8,
					season_point_history_list: [
						{
							season_id: 9,
							point_history_list: [
								{ date: 'date', message: 'message', point: 10 },
							],
						},
					],
				},
			],
		});
	});
});
