import { describe, expect, test } from 'bun:test';
import type { BeginnerMissionCategoryMaster } from '../src/state/beginner-mission-master.ts';
import {
	receiveBeginnerMissionBannerReward,
	receiveBeginnerMissionReward,
	receiveBeginnerMissionRewards,
} from '../src/state/beginner-mission-reward-state.ts';
import type { UserBeginnerMissionState } from '../src/state/beginner-mission-types.ts';

const missionCategories: BeginnerMissionCategoryMaster[] = [
	{
		missionType: 1,
		missionList: [1, 2].map((missionId) => ({
			missionId,
			name: `mission-${missionId}`,
			description: '',
			conditionType: 1,
			conditionAchieveNum: 1,
			conditionDetail: 0,
			transitionContentsId: 0,
			sortOrder: missionId,
		})),
	},
];

describe('beginner mission reward state', () => {
	test('単体・一括・banner受取を同じ受取stateへ反映する', () => {
		const state = createState();

		expect(receiveBeginnerMissionReward(state, 1)).toBe(1);
		expect(receiveBeginnerMissionReward(state, 1)).toBeUndefined();
		expect(receiveBeginnerMissionRewards(state, 1, missionCategories)).toEqual({
			mission_id_list: [2],
		});
		expect(
			receiveBeginnerMissionBannerReward(state, 1, missionCategories),
		).toBe(1);
		expect(state.receivedMissionIds).toEqual([1, 2]);
		expect(state.receivedMissionTypes).toEqual([1]);
	});

	test('未達成missionが残るbannerを受け取らない', () => {
		const state = createState();
		state.missionProgresses[1]!.status = 0;
		receiveBeginnerMissionReward(state, 1);
		expect(
			receiveBeginnerMissionBannerReward(state, 1, missionCategories),
		).toBeUndefined();
		expect(state.receivedMissionTypes).toEqual([]);
	});
});

function createState(): UserBeginnerMissionState {
	return {
		playerId: 'player-a',
		missionProgresses: [1, 2].map((missionId) => ({
			missionId,
			achievedNum: 1,
			status: 1,
		})),
		receivedMissionIds: [],
		receivedMissionTypes: [],
	};
}
