import { describe, expect, test } from 'bun:test';
import { createMissionProgressController } from '../src/application/mission-progress-controller-composition.ts';
import { createUserStatusController } from '../src/application/user-status-controller.ts';
import { createServerState } from '../src/server-state.ts';
import { createNoopServerStateStore } from '../src/server-state-store-port.ts';
import type { BeginnerMissionCategoryMaster } from '../src/state/beginner-mission-master.ts';
import type { MissionGroupMaster } from '../src/state/mission-master.ts';
import { testServerRuntimeDefaults } from './server-runtime-defaults.ts';

const missionGroups: readonly MissionGroupMaster[] = [
	{
		missionType: 2,
		startDate: null,
		endDate: null,
		achieveRewardList: [],
		missionList: [
			{
				missionId: 1,
				name: 'quest clear',
				description: '',
				conditionAchieveNum: 1,
				rewardList: [],
				transitionContentsId: 100,
			},
		],
	},
];

const beginnerMissionCategories: readonly BeginnerMissionCategoryMaster[] = [
	{
		missionType: 1,
		missionList: [
			{
				missionId: 2,
				name: 'quest clear',
				description: '',
				conditionType: 0,
				conditionAchieveNum: 1,
				conditionDetail: 0,
				transitionContentsId: 101,
				sortOrder: 1,
			},
		],
	},
];

const viewedArchiveMissionCategories: readonly BeginnerMissionCategoryMaster[] =
	[
		{
			missionType: 1,
			missionList: [
				{
					missionId: 3,
					name: 'archive view',
					description: '',
					conditionType: 51,
					conditionAchieveNum: 2,
					conditionDetail: 0,
					transitionContentsId: 0,
					sortOrder: 1,
				},
			],
		},
	];

describe('mission progress controller', () => {
	test('updates only the player specified by an operation event', () => {
		const state = createServerState(
			createNoopServerStateStore(),
			[],
			[],
			testServerRuntimeDefaults,
			() => createUserStatusController([], []),
		);
		const controller = createMissionProgressController(state, {
			getMissionGroups: () => missionGroups,
			getBeginnerMissionCategories: () => beginnerMissionCategories,
		});

		controller.apply({
			type: 'questClear',
			playerId: 'player-a',
			questLiveType: 1,
			isSkip: false,
			gameDate: '2026-06-21',
		});

		expect(state.userMissions).toHaveLength(1);
		expect(state.userMissions[0]?.playerId).toBe('player-a');
		expect(state.userMissions[0]?.missionProgresses[0]).toMatchObject({
			achievedNum: 1,
			isAchieved: true,
		});
		expect(state.userBeginnerMissions).toHaveLength(1);
		expect(state.userBeginnerMissions[0]?.playerId).toBe('player-a');
		expect(state.userBeginnerMissions[0]?.missionProgresses[0]).toMatchObject({
			achievedNum: 1,
			status: 1,
		});
	});

	test('uses the injected master source when applying each event', () => {
		const state = createServerState(
			createNoopServerStateStore(),
			[],
			[],
			testServerRuntimeDefaults,
			() => createUserStatusController([], []),
		);
		let missionGroupReadCount = 0;
		let beginnerMissionReadCount = 0;
		const controller = createMissionProgressController(state, {
			getMissionGroups: () => {
				missionGroupReadCount += 1;
				return missionGroups;
			},
			getBeginnerMissionCategories: () => {
				beginnerMissionReadCount += 1;
				return beginnerMissionCategories;
			},
		});

		controller.apply({
			type: 'profileCardSetting',
			playerId: 'player',
		});
		controller.apply({
			type: 'profileCardSetting',
			playerId: 'player',
		});

		expect(missionGroupReadCount).toBe(0);
		expect(beginnerMissionReadCount).toBe(2);
	});

	test('synchronizes user content progress for only the selected player', () => {
		const state = createServerState(
			createNoopServerStateStore(),
			[],
			[],
			testServerRuntimeDefaults,
			() => createUserStatusController([], []),
		);
		const controller = createMissionProgressController(state, {
			getMissionGroups: () => missionGroups,
			getBeginnerMissionCategories: () => viewedArchiveMissionCategories,
		});

		const syncResult = controller.syncUserContent('player-b', {
			archiveCollection: {
				playerId: 'player-b',
				watchedWithliveArchiveIds: ['1', '2'],
				watchedFesArchiveIds: [],
				userStickerStates: [],
			},
		});

		expect(state.userBeginnerMissions).toHaveLength(1);
		expect(syncResult.created).toBe(true);
		expect(syncResult.progressChanged).toBe(true);
		expect(syncResult.mission.playerId).toBe('player-b');
		expect(state.userBeginnerMissions[0]?.playerId).toBe('player-b');
		expect(state.userBeginnerMissions[0]?.missionProgresses[0]).toMatchObject({
			missionId: 3,
			achievedNum: 2,
			status: 1,
		});
	});
});
