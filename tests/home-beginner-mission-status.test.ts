import { describe, expect, test } from 'bun:test';
import type { BeginnerMissionCategoryMaster } from '../src/state/beginner-mission-master.ts';
import type { UserBeginnerMissionState } from '../src/state/beginner-mission-types.ts';
import { projectHomeBeginnerMissionStatus } from '../src/v1/route-support/home-beginner-mission-status.ts';

const categories: BeginnerMissionCategoryMaster[] = [
	{
		missionType: 91,
		missionList: [
			{
				missionId: 900101,
				name: 'mission',
				description: '',
				conditionType: 1,
				conditionAchieveNum: 1,
				conditionDetail: 0,
				transitionContentsId: 1,
				sortOrder: 1,
			},
		],
	},
];

function createMission(
	status: 0 | 1 | 2,
	receivedMissionTypes: number[] = [],
): UserBeginnerMissionState {
	return {
		playerId: 'player',
		missionProgresses: [
			{ missionId: 900101, achievedNum: status === 0 ? 0 : 1, status },
		],
		receivedMissionIds: status === 2 ? [900101] : [],
		receivedMissionTypes,
	};
}

describe('home beginner mission status', () => {
	test('is not achieved while an individual reward remains unreceived', () => {
		expect(projectHomeBeginnerMissionStatus(createMission(1), categories)).toBe(
			0,
		);
	});

	test('is not received after all individual rewards are received', () => {
		expect(projectHomeBeginnerMissionStatus(createMission(2), categories)).toBe(
			1,
		);
	});

	test('is completed after every active category banner is received', () => {
		expect(
			projectHomeBeginnerMissionStatus(createMission(2, [91]), categories),
		).toBe(2);
	});
});
