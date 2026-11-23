import type { Database } from 'bun:sqlite';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { getGradeQuestAddSkillIds } from './grade-quest-master.ts';
import {
	createGradeQuestStateBody,
	initializeGradeQuest,
	openGradeQuestSquares,
	projectGradeQuest,
	syncProjectedGradeQuestSquareProgress,
} from './grade-quest-projection.ts';
import {
	parseGradeQuestActionRequest,
	parseGradeQuestAddSkillRequest,
	parseGradeQuestStartRequest,
} from './grade-quest-session-requests.ts';

export function setGradeQuestStart(
	database: Database,
	masterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
) {
	const seriesId = parseGradeQuestStartRequest(body);
	if (seriesId === 0) {
		return undefined;
	}
	let gradeQuest = projectGradeQuest(database, userLive.currentGradeQuest);
	if (gradeQuest?.state.seriesId !== seriesId) {
		const initialized = initializeGradeQuest(database, seriesId);
		if (initialized === undefined) return undefined;
		initialized.masterReleaseId = masterReleaseId;
		userLive.currentGradeQuest = initialized;
		gradeQuest = projectGradeQuest(database, initialized);
	}
	if (gradeQuest === undefined) {
		return undefined;
	}
	return {
		body: createGradeQuestStateBody(database, gradeQuest, userLive),
		statusCode: 200,
	};
}

export function setGradeQuestAction(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
) {
	const gradeQuest = projectGradeQuest(database, userLive.currentGradeQuest);
	if (gradeQuest === undefined) {
		return undefined;
	}
	const squareId = parseGradeQuestActionRequest(body);
	const square = gradeQuest.squares.find(
		(value) => value.squareId === squareId,
	);
	const squareType = square?.squareType ?? 2;
	const targetId = square?.targetId ?? 0;
	if (square) {
		square.status = 2;
		gradeQuest.state.currentSquareId = squareId;
		gradeQuest.state.actionPoint = Math.max(
			0,
			gradeQuest.state.actionPoint - square.actionPointCost,
		);
		openGradeQuestSquares(gradeQuest);
	}
	return {
		body: {
			action_point: gradeQuest.state.actionPoint,
			square_type: squareType,
			add_skill_id_list:
				squareType === 4 ? getGradeQuestAddSkillIds(database, targetId) : null,
		},
		statusCode: 200,
	};
}

export function setGradeQuestAddSkill(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
) {
	const gradeQuest = projectGradeQuest(database, userLive.currentGradeQuest);
	if (gradeQuest === undefined) {
		return undefined;
	}
	const request = parseGradeQuestAddSkillRequest(body);
	if (request.gradeAddSkillsId > 0) {
		gradeQuest.state.activeAddSkillIds.push(request.gradeAddSkillsId);
	}
	const squareId = request.gradeQuestSquareId;
	const square = gradeQuest.squares.find(
		(value) => value.squareId === squareId,
	);
	if (square) {
		square.status = 2;
		syncProjectedGradeQuestSquareProgress(gradeQuest);
	}
	return {
		body: { action_point: gradeQuest.state.actionPoint },
		statusCode: 200,
	};
}
