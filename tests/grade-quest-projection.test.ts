import { describe, expect, test } from 'bun:test';
import {
	openGradeQuestSquares,
	type ProjectedGradeQuest,
	type ProjectedGradeQuestSquare,
	syncProjectedGradeQuestSquareProgress,
} from '../src/v1/active-master-database/grade-quest-projection.ts';
import { createGradeGoalClearData } from '../src/v1/active-master-database/grade-quest-result-responses.ts';

describe('grade quest projection', () => {
	test('opens a square only after every prerequisite is cleared', () => {
		const gradeQuest = createProjectedGradeQuest();
		getSquare(gradeQuest, 2).status = 1;

		openGradeQuestSquares(gradeQuest);
		expect(getSquare(gradeQuest, 3).status).toBe(0);

		getSquare(gradeQuest, 2).status = 2;
		openGradeQuestSquares(gradeQuest);
		expect(getSquare(gradeQuest, 3).status).toBe(1);
	});

	test('syncs selected master release squares without deleting canonical-only progress', () => {
		const gradeQuest = createProjectedGradeQuest();
		gradeQuest.state.squares.push({
			squareId: 999,
			status: 2,
			livePoint: 500,
		});
		const projectedSquare = getSquare(gradeQuest, 2);
		projectedSquare.status = 2;
		projectedSquare.livePoint = 100;

		syncProjectedGradeQuestSquareProgress(gradeQuest);

		expect(gradeQuest.state.squares).toContainEqual({
			squareId: 2,
			status: 2,
			livePoint: 100,
		});
		expect(gradeQuest.state.squares).toContainEqual({
			squareId: 999,
			status: 2,
			livePoint: 500,
		});
	});

	test('creates the observed goal clear field shape', () => {
		const gradeQuest = createProjectedGradeQuest();
		gradeQuest.state.currentSquareId = 3;

		expect(createGradeGoalClearData(gradeQuest)).toEqual({
			character_id: 1031,
			current_square_id: 3,
			quest_square_list: [
				{ grade_quest_square_id: 1, status: 2, live_point: 0 },
				{ grade_quest_square_id: 2, status: 0, live_point: 0 },
				{ grade_quest_square_id: 3, status: 0, live_point: 0 },
			],
			clear_grade_quest_rewards_id_list: [10],
			reward_list: [{ grade_quest_rewards_id: 10, is_received: true }],
			grade_up_data: null,
			is_not_received_grade_reward: false,
		});
	});
});

function createProjectedGradeQuest(): ProjectedGradeQuest {
	return {
		state: {
			seriesId: 1031,
			actionPoint: 15,
			currentSquareId: 1,
			resourceValue: 0,
			squares: [{ squareId: 1, status: 2, livePoint: 0 }],
			activeAddSkillIds: [],
		},
		characterId: 1031,
		rewards: [{ id: 10 }],
		squares: [
			{
				squareId: 1,
				squareType: 1,
				targetId: 0,
				actionPointCost: 0,
				openSquareIds: [],
				status: 2,
				livePoint: 0,
			},
			{
				squareId: 2,
				squareType: 2,
				targetId: 0,
				actionPointCost: 1,
				openSquareIds: [1],
				status: 0,
				livePoint: 0,
			},
			{
				squareId: 3,
				squareType: 7,
				targetId: 100,
				actionPointCost: 1,
				openSquareIds: [1, 2],
				status: 0,
				livePoint: 0,
			},
		],
	};
}

function getSquare(
	gradeQuest: ProjectedGradeQuest,
	squareId: number,
): ProjectedGradeQuestSquare {
	const square = gradeQuest.squares.find(
		(entry) => entry.squareId === squareId,
	);
	if (square === undefined) {
		throw new Error(`square not found: ${squareId}`);
	}
	return square;
}
