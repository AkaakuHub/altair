import type { Database } from 'bun:sqlite';
import { musicListByColumnFromDatabase } from './music-list-data.ts';

type GradeQuestSeriesRow = {
	id: number;
	order_id: number;
};

export type GradeQuestRewardRow = {
	id: number;
};

type GradeQuestSquareRow = {
	id: number;
	square_type: number;
	target_id: number;
	min_action_point: number;
	open_grade_quest_square_ids: string | null;
};

export function getGradeQuestSeasonIds(database: Database): number[] {
	const rows = database
		.query('SELECT id FROM master_grade_quest_season ORDER BY order_id')
		.all() as Array<{ id: number }>;
	return rows.map((row) => row.id);
}

export function getGradeQuestSeriesRows(
	database: Database,
	seasonId: number,
): GradeQuestSeriesRow[] {
	return database
		.query(
			[
				'SELECT id, order_id',
				'FROM master_grade_quest_series',
				'WHERE grade_quest_season_id = ?',
				'ORDER BY order_id',
			].join(' '),
		)
		.all(seasonId) as GradeQuestSeriesRow[];
}

export function findGradeQuestDefaultActionPoint(
	database: Database,
	seriesId: number,
): number | undefined {
	const row = database
		.query(
			'SELECT default_action_point FROM master_grade_quest_series WHERE id = ?',
		)
		.get(seriesId) as { default_action_point: number } | null;
	return row?.default_action_point;
}

export function findGradeQuestCharacterId(
	database: Database,
	seriesId: number,
): number | undefined {
	const row = database
		.query(
			[
				'SELECT season.generation',
				'FROM master_grade_quest_series AS series',
				'JOIN master_grade_quest_season AS season',
				'ON season.id = series.grade_quest_season_id',
				'WHERE series.id = ?',
			].join(' '),
		)
		.get(seriesId) as { generation: number } | null;
	return row === null ? undefined : row.generation * 10 + 1;
}

export function getGradeQuestSeriesRewards(
	database: Database,
	seriesId: number,
): GradeQuestRewardRow[] {
	return database
		.query(
			[
				'SELECT id',
				'FROM master_grade_quest_rewards',
				'WHERE grade_quest_series_id = ?',
				'ORDER BY order_id',
			].join(' '),
		)
		.all(seriesId) as GradeQuestRewardRow[];
}

export function getGradeQuestSeriesSquares(
	database: Database,
	seriesId: number,
): GradeQuestSquareRow[] {
	return database
		.query(
			[
				'SELECT square.id, square_data.square_type, square_data.target_id,',
				'square_data.min_action_point, square.open_grade_quest_square_ids',
				'FROM master_grade_quest_square AS square',
				'JOIN master_grade_quest_square_datas AS square_data',
				'ON square_data.id = square.square_id',
				'WHERE square.grade_quest_series_id = ?',
				'ORDER BY square.id',
			].join(' '),
		)
		.all(seriesId) as GradeQuestSquareRow[];
}

export function getGradeQuestAddSkillIds(
	database: Database,
	targetId: number,
): number[] {
	const targetSkill = database
		.query('SELECT id FROM master_grade_add_skills WHERE id = ?')
		.get(targetId) as { id: number } | null;
	if (targetSkill) {
		return [targetSkill.id];
	}
	if (targetId !== 1) {
		return [];
	}
	return getObservedGradeAddSkillIdsForTargetOne(database);
}

export function getGradeQuestStageMusicList(
	database: Database,
	stageId: number,
) {
	const row = database
		.query(
			[
				'SELECT quest_musics_type, quest_musics_detail',
				'FROM master_grade_quest_stages',
				'WHERE id = ?',
			].join(' '),
		)
		.get(stageId) as {
		quest_musics_type: number;
		quest_musics_detail: number;
	} | null;
	if (!row) return [];
	if (row.quest_musics_type === 2 && row.quest_musics_detail > 0) {
		return [{ m_musics_id: row.quest_musics_detail, is_enable: true }];
	}
	if (row.quest_musics_type === 0 && row.quest_musics_detail > 0) {
		return musicListByColumnFromDatabase(
			database,
			'generations_id',
			row.quest_musics_detail,
		);
	}
	return [];
}

export function getGradeQuestRequiredLivePoint(
	database: Database,
	stageId: number,
): number {
	const row = database
		.query('SELECT live_point FROM master_grade_quest_stages WHERE id = ?')
		.get(stageId) as { live_point: number } | null;
	if (!row) {
		throw new Error(`grade quest stage not found: ${stageId}`);
	}
	return row.live_point;
}

function getObservedGradeAddSkillIdsForTargetOne(database: Database): number[] {
	const skillIds = [41008001, 41008002, 41009010];
	const rows = database
		.query(
			[
				'SELECT id',
				'FROM master_grade_add_skills',
				`WHERE id IN (${skillIds.map(() => '?').join(',')})`,
				'ORDER BY CASE id',
				...skillIds.map((id, index) => `WHEN ${id} THEN ${index}`),
				'END',
			].join(' '),
		)
		.all(...skillIds) as Array<{ id: number }>;
	return rows.map((row) => row.id);
}
