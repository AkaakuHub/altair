import { describe, expect, test } from 'bun:test';
import { applyRawServerStateMigrations } from '../src/state-migrations/raw-server-state-migrations.ts';

describe('grade quest state', () => {
	test('raw migration keeps progress and removes copied master fields', () => {
		const state = {
			userLives: [
				{
					currentGradeQuest: {
						active: true,
						masterReleaseId: 'release-a',
						seriesId: 10311,
						characterId: 1031,
						generation: 103,
						actionPoint: 14,
						currentSquareId: 21031101,
						resourceValue: 3,
						activeAddSkillIds: [41008001],
						rewardsJson: [{ grade_quest_rewards_id: 1031101 }],
						squares: [
							{
								squareId: 21031101,
								squareType: 2,
								targetId: 0,
								actionPointCost: 1,
								openSquareIds: [11031101],
								status: 2,
								livePoint: 25,
							},
						],
					},
				},
			],
		};

		expect(applyRawServerStateMigrations(state)).toEqual({
			userLives: [
				{
					currentGradeQuest: {
						masterReleaseId: 'release-a',
						seriesId: 10311,
						actionPoint: 14,
						currentSquareId: 21031101,
						resourceValue: 3,
						activeAddSkillIds: [41008001],
						squares: [{ squareId: 21031101, status: 2, livePoint: 25 }],
					},
				},
			],
		});
	});
});
