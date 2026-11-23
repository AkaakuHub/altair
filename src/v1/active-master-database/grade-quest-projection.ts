import type { Database } from 'bun:sqlite';
import { getGradeQuestSeriesIdentityFingerprints } from '../../master-data/grade-progress-identity.ts';
import type { UserGradeQuestState } from '../../state/user-grade-quest-state.ts';
import { findCompatibleGradeQuestProgress } from '../../state/user-grade-quest-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	findGradeQuestCharacterId,
	findGradeQuestDefaultActionPoint,
	type GradeQuestRewardRow,
	getGradeQuestSeriesRewards,
	getGradeQuestSeriesSquares,
} from './grade-quest-master.ts';
import { parseCommaSeparatedIntegerList } from './json-utils.ts';

export type ProjectedGradeQuestSquare = {
	squareId: number;
	squareType: number;
	targetId: number;
	actionPointCost: number;
	openSquareIds: number[];
	status: number;
	livePoint: number;
};

export type ProjectedGradeQuest = {
	state: UserGradeQuestState;
	characterId: number;
	squares: ProjectedGradeQuestSquare[];
	rewards: GradeQuestRewardRow[];
};

export function initializeGradeQuest(
	database: Database,
	seriesId: number,
): UserGradeQuestState | undefined {
	const defaultActionPoint = findGradeQuestDefaultActionPoint(
		database,
		seriesId,
	);
	if (defaultActionPoint === undefined) {
		return undefined;
	}
	const gradeQuest: UserGradeQuestState = {
		seriesId,
		actionPoint: defaultActionPoint,
		currentSquareId: 0,
		resourceValue: 0,
		squares: [],
		activeAddSkillIds: [],
	};
	gradeQuest.squares = getGradeQuestSeriesSquares(database, seriesId).map(
		(square) => {
			const state = {
				squareId: square.id,
				status: 0,
				livePoint: 0,
			};
			if (square.square_type === 1) {
				state.status = 2;
				gradeQuest.currentSquareId = state.squareId;
			}
			return state;
		},
	);
	const projected = projectGradeQuest(database, gradeQuest);
	if (projected === undefined) return undefined;
	openGradeQuestSquares(projected);
	return gradeQuest;
}

export function projectGradeQuest(
	database: Database,
	state: UserGradeQuestState | null,
): ProjectedGradeQuest | undefined {
	if (state === null) return undefined;
	const characterId = findGradeQuestCharacterId(database, state.seriesId);
	const squareRows = getGradeQuestSeriesSquares(database, state.seriesId);
	if (characterId === undefined || squareRows.length === 0) return undefined;
	const progressBySquareId = new Map(
		state.squares.map((square) => [square.squareId, square]),
	);
	return {
		state,
		characterId,
		rewards: getGradeQuestSeriesRewards(database, state.seriesId),
		squares: squareRows.map((square) => {
			const progress = progressBySquareId.get(square.id);
			return {
				squareId: square.id,
				squareType: square.square_type,
				targetId: square.target_id,
				actionPointCost: square.min_action_point,
				openSquareIds: parseCommaSeparatedIntegerList(
					square.open_grade_quest_square_ids,
				),
				status: progress?.status ?? 0,
				livePoint: progress?.livePoint ?? 0,
			};
		}),
	};
}

export function openGradeQuestSquares(gradeQuest: ProjectedGradeQuest): void {
	for (const square of gradeQuest.squares) {
		if (square.status !== 0 || square.openSquareIds.length === 0) {
			continue;
		}
		if (
			square.openSquareIds.every((id) =>
				gradeQuest.squares.some(
					(other) => other.squareId === id && other.status === 2,
				),
			)
		) {
			square.status = 1;
		}
	}
	syncProjectedGradeQuestSquareProgress(gradeQuest);
}

export function syncProjectedGradeQuestSquareProgress(
	gradeQuest: ProjectedGradeQuest,
): void {
	const projectedById = new Map(
		gradeQuest.squares.map((square) => [square.squareId, square]),
	);
	for (const progress of gradeQuest.state.squares) {
		const projected = projectedById.get(progress.squareId);
		if (projected !== undefined) {
			progress.status = projected.status;
			progress.livePoint = projected.livePoint;
		}
	}
	for (const square of gradeQuest.squares) {
		if (
			!gradeQuest.state.squares.some(
				(entry) => entry.squareId === square.squareId,
			)
		) {
			gradeQuest.state.squares.push({
				squareId: square.squareId,
				status: square.status,
				livePoint: square.livePoint,
			});
		}
	}
}

export function createGradeQuestStateBody(
	database: Database,
	gradeQuest: ProjectedGradeQuest,
	userLive: UserLiveState,
) {
	return {
		character_id: gradeQuest.characterId,
		current_square_id: gradeQuest.state.currentSquareId,
		action_point: gradeQuest.state.actionPoint,
		quest_square_list: createGradeQuestSquareList(gradeQuest),
		active_add_skill_id_list: gradeQuest.state.activeAddSkillIds,
		lot_add_skill_id_list: [] satisfies [],
		reward_list: createGradeQuestRewardList(gradeQuest, false),
		point_bonus_list: [
			{
				bonus_type: 1,
				target_detail: 0,
				target_num: 300 + countClearedGradeQuests(database, userLive),
				bonus_value: 10000,
			},
		],
	};
}

export function createGradeQuestRewardList(
	gradeQuest: ProjectedGradeQuest,
	isReceived: boolean,
) {
	return gradeQuest.rewards.map((reward) => ({
		grade_quest_rewards_id: reward.id,
		is_received: isReceived,
	}));
}

export function createGradeQuestSquareList(gradeQuest: ProjectedGradeQuest) {
	return gradeQuest.squares.map((square) => ({
		grade_quest_square_id: square.squareId,
		status: square.status,
		live_point: square.livePoint,
	}));
}

function countClearedGradeQuests(
	database: Database,
	userLive: UserLiveState,
): number {
	return [...getGradeQuestSeriesIdentityFingerprints(database)].filter(
		([seriesId, fingerprint]) =>
			(findCompatibleGradeQuestProgress(
				userLive.gradeQuestProgressList,
				seriesId,
				fingerprint,
			)?.clearStatus ?? 0) > 0,
	).length;
}
