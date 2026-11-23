import { describe, expect, test } from 'bun:test';
import { getAchievedMissionNotificationList } from '../src/state/rhythm-game-class-mission-notification-state.ts';

describe('rhythm game class mission notification state', () => {
	test('calculates notifications from the selected user and injected master', () => {
		const userLive = {
			playerId: 'player-a',
			rhythmMusicScores: [
				{
					musicId: 1,
					clearCount: 2,
					totalScoreAccumulated: 300,
					highScore: 200,
					highScoreAchievementStatus: 0,
					musicMasteryLevel: 1,
					musicMasteryExperience: 0,
					difficultyScores: [],
				},
			],
			rhythmGameClassMissionReceivedOrders: [],
		};
		const inputs: Array<{
			conditionType: number;
			progress: number;
			receivedOrder: number;
		}> = [];

		const result = getAchievedMissionNotificationList(
			{ userLives: [userLive] },
			{ playerId: 'player-a' },
			{
				projectScores: (scores) => scores,
				getReceivableIds: (input) => {
					inputs.push(input);
					return [input.conditionType * 10];
				},
			},
		);

		expect(result).toEqual([10, 20, 30]);
		expect(inputs).toEqual([
			{ conditionType: 1, progress: 2, receivedOrder: 0 },
			{ conditionType: 2, progress: 300, receivedOrder: 0 },
			{ conditionType: 3, progress: 200, receivedOrder: 0 },
		]);
	});
});
