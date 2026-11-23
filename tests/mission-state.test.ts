import { describe, expect, test } from 'bun:test';
import type { MissionGroupMaster } from '../src/state/mission-master.ts';
import { applyRawServerStateMigrations } from '../src/state-migrations/raw-server-state-migrations.ts';
import { createMissionListResponse } from '../src/v1/responses/mission-list-response.ts';

describe('mission state master boundary', () => {
	test('migrates legacy mission definitions to progress only', () => {
		const migrated = applyRawServerStateMigrations({
			userActivityRecords: [],
			userArchiveCollections: [
				{
					stickerInfoList: [
						{
							stickers_id: 1001,
							requirement_progress: 2,
							variant_requirement_progress: 3,
							is_owned: true,
							is_available_variant: false,
							create_time: '2026-07-11T00:00:00Z',
						},
					],
				},
			],
			userMissions: [
				{
					playerId: 'player-a',
					commonMissionInfo: {
						receivedOrder: 1,
						rhythmGameStar: 2,
						schoolStageStar: 3,
					},
					missionGroups: [
						{
							missionList: [
								{
									missionId: 10,
									name: 'legacy master name',
									achievedNum: 4,
									isAchieved: true,
								},
								{
									missionId: 11,
									name: 'copied default',
									achievedNum: 0,
									isAchieved: false,
								},
							],
						},
					],
					dailyMissionGameDate: null,
				},
			],
		});

		expect(migrated).toEqual(
			expect.objectContaining({
				userMissions: [
					expect.objectContaining({
						missionProgresses: [
							{ missionId: 10, achievedNum: 4, isAchieved: true },
						],
					}),
				],
			}),
		);
		expect(JSON.stringify(migrated)).not.toContain('legacy master name');
		expect(migrated).toEqual(
			expect.objectContaining({
				userArchiveCollections: [
					expect.objectContaining({
						userStickerStates: [
							{
								stickerId: 1001,
								requirementProgress: 2,
								variantRequirementProgress: 3,
								isOwned: true,
								isAvailableVariant: false,
								createTime: '2026-07-11T00:00:00Z',
							},
						],
					}),
				],
			}),
		);
		expect(JSON.stringify(migrated)).not.toContain('stickerInfoList');
	});

	test('creates the response from selected master and stored progress', () => {
		const selectedMaster: MissionGroupMaster[] = [
			{
				missionType: 1,
				startDate: null,
				endDate: null,
				achieveRewardList: [],
				missionList: [
					{
						missionId: 10,
						name: 'selected name',
						description: 'selected description',
						conditionAchieveNum: 99,
						rewardList: [
							{
								rewardType: 1,
								itemType: 2,
								itemId: 3,
								rewardNum: 777,
							},
						],
						transitionContentsId: 4,
					},
				],
			},
		];

		const response = createMissionListResponse(
			{
				playerId: 'player-a',
				commonMissionInfo: {
					receivedOrder: 0,
					rhythmGameStar: 0,
					schoolStageStar: 0,
				},
				missionProgresses: [
					{ missionId: 10, achievedNum: 4, isAchieved: false },
				],
				dailyMissionGameDate: null,
			},
			selectedMaster,
		);

		expect(response.mission_list[0]?.mission_list[0]).toEqual(
			expect.objectContaining({
				mission_id: 10,
				name: 'selected name',
				description: 'selected description',
				condition_achieve_num: 99,
				achieved_num: 4,
				reward_list: [expect.objectContaining({ reward_num: 777 })],
			}),
		);
	});

	test('removes default beginner mission rows during raw migration', () => {
		const migrated = applyRawServerStateMigrations({
			userActivityRecords: [],
			userBeginnerMissions: [
				{
					missionProgresses: [
						{ missionId: 1, achievedNum: 0, status: 0 },
						{ missionId: 2, achievedNum: 1, status: 0 },
					],
				},
			],
		});

		expect(migrated).toEqual(
			expect.objectContaining({
				userBeginnerMissions: [
					expect.objectContaining({
						missionProgresses: [{ missionId: 2, achievedNum: 1, status: 0 }],
					}),
				],
			}),
		);
	});
});
