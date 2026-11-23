import { describe, expect, test } from 'bun:test';
import {
	createCommonMissionRewardMaster,
	createMissionMaster,
	createMissionReward,
} from '../src/master-data/mission-master-row-mappers.ts';

describe('mission master row mappers', () => {
	test('mission rowとreward rowをdomain masterへ変換する', () => {
		const reward = createMissionReward({
			reward_category: 2,
			reward_type: 3,
			items_id: 100,
			reward_num: 4,
		});
		expect(
			createMissionMaster(
				{
					id: 10,
					name: 'mission',
					description: 'description',
					mission_condition_num: 5,
					transition_contents_id: 6,
				},
				[reward],
				1,
			),
		).toEqual({
			missionId: 10,
			name: 'mission',
			description: 'description',
			conditionAchieveNum: 5,
			rewardList: [{ rewardType: 2, itemType: 3, itemId: 100, rewardNum: 4 }],
			transitionContentsId: 6,
			identityFingerprint: {
				domain: 'mission',
				value: '[10,1,6]',
			},
		});
	});

	test('common mission rowの受取順と報酬を保持する', () => {
		expect(
			createCommonMissionRewardMaster({
				id: 20,
				clear_condition_num: 30,
				reward_type: 4,
				items_id: 200,
				reward_num: 2,
				order_id: 40,
			}),
		).toEqual({
			commonMissionId: 20,
			clearConditionNum: 30,
			orderId: 40,
			identityFingerprint: {
				domain: 'common-mission-reward',
				value: '[20,40]',
			},
			reward: { itemType: 4, itemId: 200, amount: 2 },
		});
	});
});
