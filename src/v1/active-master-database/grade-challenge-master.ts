import type { Database } from 'bun:sqlite';

type GradeChallengeStageRow = {
	id: number;
	grade_chal_season_id: number;
	quest_musics_type: number;
	quest_musics_detail: number;
	order_id: number;
};

export type GradeChallengeStageRewardRow = {
	id: number;
	grade_chal_quest_stages_id: number;
	order_id: number;
	conditions_type: number;
	conditions_value: number;
};

type GradeDataRow = {
	grade_num: number;
};

export function getGradeChallengeStages(
	database: Database,
	gradeChallengeSeasonId: number,
): GradeChallengeStageRow[] {
	return database
		.query<GradeChallengeStageRow, [number]>(
			[
				'SELECT id, grade_chal_season_id, quest_musics_type, quest_musics_detail, order_id',
				'FROM master_grade_chal_quest_stages',
				'WHERE grade_chal_season_id = ?',
				'ORDER BY order_id',
			].join(' '),
		)
		.all(gradeChallengeSeasonId);
}

export function findGradeChallengeStage(
	database: Database,
	stageId: number,
): GradeChallengeStageRow | null {
	return database
		.query<GradeChallengeStageRow, [number]>(
			[
				'SELECT id, grade_chal_season_id, quest_musics_type, quest_musics_detail, order_id',
				'FROM master_grade_chal_quest_stages',
				'WHERE id = ?',
			].join(' '),
		)
		.get(stageId);
}

export function getGradeChallengeStageRewards(
	database: Database,
	stageIds: number[],
): Map<number, GradeChallengeStageRewardRow[]> {
	if (stageIds.length === 0) {
		return new Map();
	}
	const rows = database
		.query<GradeChallengeStageRewardRow, number[]>(
			[
				'SELECT id, grade_chal_quest_stages_id, order_id, conditions_type, conditions_value',
				'FROM master_grade_chal_quest_stages_rewards',
				`WHERE grade_chal_quest_stages_id IN (${stageIds.map(() => '?').join(',')})`,
				'ORDER BY grade_chal_quest_stages_id, order_id',
			].join(' '),
		)
		.all(...stageIds);
	const rewardsByStageId = new Map<number, GradeChallengeStageRewardRow[]>();
	for (const row of rows) {
		const stageRewards =
			rewardsByStageId.get(row.grade_chal_quest_stages_id) ?? [];
		stageRewards.push(row);
		rewardsByStageId.set(row.grade_chal_quest_stages_id, stageRewards);
	}
	return rewardsByStageId;
}

export function getGradeNumForGradePoint(
	database: Database,
	gradePoint: number,
): number {
	const row = database
		.query<GradeDataRow, [number]>(
			[
				'SELECT grade_num',
				'FROM master_grade_datas',
				'WHERE require_grade_points <= ?',
				'ORDER BY require_grade_points DESC',
				'LIMIT 1',
			].join(' '),
		)
		.get(gradePoint);
	if (row === null) {
		throw new Error(`grade data not found for grade point ${gradePoint}`);
	}
	return row.grade_num;
}
