import type { Database } from 'bun:sqlite';
import { normalizeUtcDateTime } from './master-date-time.ts';

export type StandardQuestAdminAreaMaster = {
	areaId: number;
	name: string;
	number: number;
	description: string;
	orderId: number;
	generationId: number;
	startDate: string;
	endDate: string;
	stages: StandardQuestAdminStageMaster[];
};

export type StandardQuestAdminStageMaster = {
	stageId: number;
	name: string;
	description: string;
	stageType: number;
	useType: number;
	useItem: number;
	useNum: number;
	questMusicsType: number;
	questMusicsDetail: number;
	questLevel: number;
	score1: number;
	score2: number;
	score3: number;
};

type StandardQuestAreaRow = {
	id: number;
	name: string;
	number: number;
	description: string;
	order_id: number;
	generations_id: number;
	start_time: string;
	end_time: string;
};

type StandardQuestStageRow = {
	id: number;
	name: string;
	description: string;
	stage_type: number;
	use_type: number;
	use_item: number;
	use_num: number;
	quest_musics_type: number;
	quest_musics_detail: number;
	quest_level: number;
	score1: number;
	score2: number;
	score3: number;
};

export function getStandardQuestAdminAreasFromDatabase(
	database: Database,
): StandardQuestAdminAreaMaster[] {
	const rows = database
		.query<StandardQuestAreaRow, []>(
			[
				'SELECT id, name, number, description, order_id, generations_id, start_time, end_time',
				'FROM master_standard_quest_areas',
				'ORDER BY order_id, id',
			].join(' '),
		)
		.all();
	return rows.map((row) => ({
		areaId: row.id,
		name: row.name,
		number: row.number,
		description: row.description,
		orderId: row.order_id,
		generationId: row.generations_id,
		startDate: normalizeUtcDateTime(row.start_time),
		endDate: normalizeUtcDateTime(row.end_time),
		stages: getStandardQuestAdminStages(database, row.id),
	}));
}

function getStandardQuestAdminStages(
	database: Database,
	areaId: number,
): StandardQuestAdminStageMaster[] {
	const rows = database
		.query<StandardQuestStageRow, [number]>(
			[
				'SELECT id, name, description, stage_type, use_type, use_item, use_num,',
				'quest_musics_type, quest_musics_detail, quest_level, score1, score2, score3',
				'FROM master_standard_quest_stages',
				'WHERE standard_quest_areas_id = ?',
				'ORDER BY id',
			].join(' '),
		)
		.all(areaId);
	return rows.map((row) => ({
		stageId: row.id,
		name: row.name,
		description: row.description,
		stageType: row.stage_type,
		useType: row.use_type,
		useItem: row.use_item,
		useNum: row.use_num,
		questMusicsType: row.quest_musics_type,
		questMusicsDetail: row.quest_musics_detail,
		questLevel: row.quest_level,
		score1: row.score1,
		score2: row.score2,
		score3: row.score3,
	}));
}
