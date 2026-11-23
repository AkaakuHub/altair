import type { Database } from 'bun:sqlite';

type StandardQuestStageIdRow = {
	stage_id: number;
};

export function listStandardQuestStageIds(
	database: Database,
	areaId: number,
): StandardQuestStageIdRow[] {
	return database
		.query<StandardQuestStageIdRow, [number]>(
			'SELECT id AS stage_id FROM master_standard_quest_stages WHERE standard_quest_areas_id = ? ORDER BY id',
		)
		.all(areaId);
}

export function findStandardQuestStageAreaId(
	database: Database,
	stageId: number,
): number | undefined {
	const row = database
		.query<{ area_id: number }, [number]>(
			'SELECT standard_quest_areas_id AS area_id FROM master_standard_quest_stages WHERE id = ?',
		)
		.get(stageId);
	return row?.area_id;
}

export function findItemSourceStandardQuestStageIds(
	database: Database,
	itemId: number,
): string | undefined {
	const row = database
		.query<{ standard_quest_stages_id: string | null }, [number]>(
			'SELECT standard_quest_stages_id FROM master_item_sources WHERE items_id = ?',
		)
		.get(itemId);
	return row?.standard_quest_stages_id ?? undefined;
}
