import { describe, expect, test } from 'bun:test';
import {
	projectCompletedTutorialIds,
	supportedTutorialIds,
} from '../src/state/user-tutorial-state.ts';

describe('tutorial state projection', () => {
	test('対応するIDだけを投影し、canonical completionを保持する', () => {
		const tutorial = {
			playerId: 'player',
			completedTutorialIds: [20, 50, 9999],
		};

		expect(projectCompletedTutorialIds(tutorial, supportedTutorialIds)).toEqual(
			[20, 50],
		);
		expect(tutorial.completedTutorialIds).toEqual([20, 50, 9999]);
	});
});
