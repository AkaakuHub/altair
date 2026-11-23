import { describe, expect, test } from 'bun:test';
import { gradeChallengePointFromLove } from '../src/v1/active-master-database/grade-challenge-result-response.ts';
import {
	createGradeChallengeStageRewardInfoList,
	isGradeChallengeStageRewardReceived,
} from '../src/v1/active-master-database/grade-challenge-stage.ts';

describe('grade challenge response', () => {
	test('preserves the observed play count reward boundary', () => {
		const reward = {
			id: 1,
			grade_chal_quest_stages_id: 10,
			order_id: 1,
			conditions_type: 1,
			conditions_value: 1,
		};

		expect(isGradeChallengeStageRewardReceived(reward, 0, 1)).toBe(false);
		expect(isGradeChallengeStageRewardReceived(reward, 0, 2)).toBe(true);
	});

	test('maps stage reward conditions to the official response shape', () => {
		expect(
			createGradeChallengeStageRewardInfoList(
				[
					{
						id: 1,
						grade_chal_quest_stages_id: 10,
						order_id: 1,
						conditions_type: 1,
						conditions_value: 0,
					},
					{
						id: 2,
						grade_chal_quest_stages_id: 10,
						order_id: 2,
						conditions_type: 2,
						conditions_value: 100,
					},
				],
				100,
				1,
			),
		).toEqual([
			{
				grade_chal_quest_stages_rewards_id: 1,
				is_received: true,
			},
			{
				grade_chal_quest_stages_rewards_id: 2,
				is_received: true,
			},
		]);
	});

	test('converts only full billion love units to grade points', () => {
		expect(gradeChallengePointFromLove(999_999_999)).toBe(0);
		expect(gradeChallengePointFromLove(2_500_000_000)).toBe(2);
	});
});
