import type { Database } from 'bun:sqlite';
import { getGradeQuestSeriesIdentityFingerprint } from '../../master-data/grade-progress-identity.ts';
import { saveGradeQuestProgress } from '../../state/user-grade-quest-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { getGradeQuestRequiredLivePoint } from './grade-quest-master.ts';
import {
	createGradeQuestRewardList,
	createGradeQuestSquareList,
	openGradeQuestSquares,
	type ProjectedGradeQuest,
	projectGradeQuest,
	syncProjectedGradeQuestSquareProgress,
} from './grade-quest-projection.ts';
import { numberValue } from './json-utils.ts';

export function getGradeResult(database: Database, userLive: UserLiveState) {
	const gradeQuest = projectGradeQuest(database, userLive.currentGradeQuest);
	const currentQuestLive = userLive.currentQuestLive;
	if (gradeQuest === undefined || !currentQuestLive) {
		return undefined;
	}
	const score = currentQuestLive.score;
	const livePoint = Math.floor(score / 1000);
	const requiredLivePoint = getGradeQuestRequiredLivePoint(
		database,
		currentQuestLive.stageId,
	);
	gradeQuest.state.actionPoint = Math.max(
		0,
		gradeQuest.state.actionPoint - gradeQuest.state.resourceValue,
	);
	gradeQuest.state.resourceValue = 0;
	const square = gradeQuest.squares.find(
		(value) => value.targetId === currentQuestLive.stageId,
	);
	const beforeLivePoint = square?.livePoint ?? 0;
	const totalLivePoint = beforeLivePoint + livePoint;
	const questResult = totalLivePoint >= requiredLivePoint;
	if (square) {
		square.livePoint = totalLivePoint;
		if (questResult) {
			square.status = 2;
			gradeQuest.state.currentSquareId = square.squareId;
			openGradeQuestSquares(gradeQuest);
		}
	}
	syncProjectedGradeQuestSquareProgress(gradeQuest);
	const allCleared = gradeQuest.squares
		.filter((value) => value.squareType === 7)
		.every((value) => value.status === 2);
	const body = {
		quest_live_type: 4,
		quest_stage_id: currentQuestLive.stageId,
		quest_result: questResult,
		result_love: score,
		play_report: currentQuestLive.playReport,
		add_live_point: livePoint,
		before_live_point: beforeLivePoint,
		point_bonus_list: [] satisfies [],
		action_point: gradeQuest.state.actionPoint,
		goal_clear_data: null as ReturnType<typeof createGradeGoalClearData> | null,
	};
	if (allCleared) {
		const hasBonusSquare = gradeQuest.squares.some(
			(value) => value.squareType === 6 && value.status === 2,
		);
		const identityFingerprint = getGradeQuestSeriesIdentityFingerprint(
			database,
			gradeQuest.state.seriesId,
		);
		if (
			identityFingerprint === undefined ||
			gradeQuest.state.masterReleaseId === undefined
		) {
			throw new Error(
				`grade quest series identity not found: ${gradeQuest.state.seriesId}`,
			);
		}
		userLive.gradeQuestProgressList = saveGradeQuestProgress(
			userLive.gradeQuestProgressList,
			{
				seriesId: gradeQuest.state.seriesId,
				clearStatus: 2,
				bonusCleared: hasBonusSquare,
			},
			{
				sourceMasterReleaseId: gradeQuest.state.masterReleaseId,
				identityFingerprint,
			},
		);
		body.goal_clear_data = createGradeGoalClearData(gradeQuest);
		userLive.currentGradeQuest = null;
	}
	return { body, statusCode: 200 };
}

export function retireGradeQuest(database: Database, userLive: UserLiveState) {
	const gradeQuest = projectGradeQuest(database, userLive.currentGradeQuest);
	if (gradeQuest === undefined) {
		return undefined;
	}
	const body = {
		clear_grade_quest_rewards_id_list: [] satisfies [],
		live_point: 0,
		reward_list: createGradeQuestRewardList(gradeQuest, false),
		grade_up_data: null,
	};
	userLive.currentGradeQuest = null;
	return { body, statusCode: 200 };
}

export function createGradeGoalClearData(gradeQuest: ProjectedGradeQuest) {
	return {
		character_id: gradeQuest.characterId,
		current_square_id: gradeQuest.state.currentSquareId,
		quest_square_list: createGradeQuestSquareList(gradeQuest),
		clear_grade_quest_rewards_id_list: createGradeQuestRewardList(
			gradeQuest,
			true,
		).map((reward) => numberValue(reward.grade_quest_rewards_id)),
		reward_list: createGradeQuestRewardList(gradeQuest, true),
		grade_up_data: null,
		is_not_received_grade_reward: false,
	};
}
