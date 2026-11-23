import { describe, expect, test } from 'bun:test';
import { composeMissionGroups } from '../src/master-data/mission-group-composition.ts';

describe('mission group composition', () => {
	test('category順とreward公式mappingを維持する', () => {
		const groups = composeMissionGroups({
			missions: [
				{
					id: 10,
					name: 'mission',
					description: 'description',
					mission_type: 2,
					mission_condition_num: 3,
					transition_contents_id: 4,
					sort_order: 1,
				},
			],
			rewards: [
				{
					missions_id: 10,
					reward_category: 1,
					reward_type: 2,
					items_id: 30,
					reward_num: 5,
				},
			],
			achieveRewards: [],
			eventSeries: [],
			eventMissions: [],
			eventRewards: [],
		});
		expect(groups).toHaveLength(1);
		expect(groups[0]?.missionType).toBe(2);
		expect(groups[0]?.missionList[0]).toMatchObject({
			missionId: 10,
			transitionContentsId: 4,
			rewardList: [{ rewardType: 1, itemType: 2, itemId: 30, rewardNum: 5 }],
		});
	});
});
