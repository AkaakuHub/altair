import { describe, expect, test } from 'bun:test';
import { createMissionIdentityFingerprint } from '../src/master-data/mission-identity.ts';
import { getMissionProgress } from '../src/state/mission-progress-aggregate.ts';
import { incrementMissionProgressByTransition } from '../src/state/mission-transition-progress.ts';
import type { UserMissionState } from '../src/state/mission-types.ts';

function missionMaster(transitionContentsId: number) {
	return {
		missionType: 1,
		startDate: null,
		endDate: null,
		achieveRewardList: [],
		missionList: [
			{
				missionId: 10,
				name: 'display',
				description: 'display',
				conditionAchieveNum: 100,
				rewardList: [],
				transitionContentsId,
				identityFingerprint: createMissionIdentityFingerprint({
					missionId: 10,
					missionType: 1,
					transitionContentsId,
				}),
			},
		],
	};
}

describe('mission progress version', () => {
	test('keeps same id progress independently across structural identities', () => {
		const state: UserMissionState = {
			playerId: 'player',
			commonMissionInfo: {
				receivedOrder: 0,
				rhythmGameStar: 0,
				schoolStageStar: 0,
			},
			missionProgresses: [],
			dailyMissionGameDate: null,
		};
		const oldMaster = missionMaster(100);
		const newMaster = missionMaster(200);
		incrementMissionProgressByTransition(state, [oldMaster], 100, 2, 'old');
		incrementMissionProgressByTransition(state, [newMaster], 200, 3, 'new');

		expect(
			getMissionProgress(
				state,
				10,
				oldMaster.missionList[0]?.identityFingerprint,
			),
		).toMatchObject({ achievedNum: 2, sourceMasterReleaseId: 'old' });
		expect(
			getMissionProgress(
				state,
				10,
				newMaster.missionList[0]?.identityFingerprint,
			),
		).toMatchObject({ achievedNum: 3, sourceMasterReleaseId: 'new' });
		expect(state.missionProgresses).toHaveLength(2);
	});

	test('retains legacy as first-bind basis without mutating it', () => {
		const legacy = { missionId: 10, achievedNum: 4, isAchieved: false };
		const state: UserMissionState = {
			playerId: 'player',
			commonMissionInfo: {
				receivedOrder: 0,
				rhythmGameStar: 0,
				schoolStageStar: 0,
			},
			missionProgresses: [legacy],
			dailyMissionGameDate: null,
		};
		const master = missionMaster(100);
		incrementMissionProgressByTransition(state, [master], 100, 1, 'release');
		expect(legacy.achievedNum).toBe(4);
		expect(state.missionProgresses).toHaveLength(2);
		expect(
			getMissionProgress(state, 10, master.missionList[0]?.identityFingerprint),
		).toMatchObject({ achievedNum: 5, sourceMasterReleaseId: 'release' });
	});
});
