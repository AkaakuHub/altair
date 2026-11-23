import type { Database } from 'bun:sqlite';

export type DreamQuestSeriesRow = {
	id: number;
	characters_id: number;
	name: string;
	order_id: number;
	dream_live_series_list_id: number;
};

type DreamQuestStageRow = {
	id: number;
	dream_quest_series_id: number;
	quest_musics_type: number;
	quest_musics_detail: number;
};

export type DreamLiveConditionRow = {
	conditions_type: number;
	conditions_values: number[];
};

export function getDreamQuestSeriesRows(
	database: Database,
): DreamQuestSeriesRow[] {
	return database
		.query(
			[
				'SELECT id, characters_id, name, order_id, dream_live_series_list_id',
				'FROM master_dream_quest_series',
				'ORDER BY dream_live_series_list_id, order_id, id',
			].join(' '),
		)
		.all() as DreamQuestSeriesRow[];
}

export function getFirstDreamQuestStage(
	database: Database,
	seriesId: number,
): DreamQuestStageRow {
	const row = database
		.query(
			[
				'SELECT id, dream_quest_series_id, quest_musics_type, quest_musics_detail',
				'FROM master_dream_quest_stages',
				'WHERE dream_quest_series_id = ?',
				'ORDER BY id',
				'LIMIT 1',
			].join(' '),
		)
		.get(seriesId) as DreamQuestStageRow | null;
	if (row === null) {
		throw new Error(`Dream Live stage not found: ${seriesId}`);
	}
	return row;
}

export function getDreamLiveConditionRows(
	database: Database,
	stageId: number,
): DreamLiveConditionRow[] {
	const rows = database
		.query(
			[
				'SELECT conditions_type, conditions_value',
				'FROM master_dream_live_release_conditions',
				'WHERE release_dream_live_id = ?',
				'ORDER BY id',
			].join(' '),
		)
		.all(stageId) as {
		conditions_type: number;
		conditions_value: number;
	}[];

	return groupDreamLiveConditionRows(rows);
}

export function groupDreamLiveConditionRows(
	rows: ReadonlyArray<{
		conditions_type: number;
		conditions_value: number;
	}>,
): DreamLiveConditionRow[] {
	return rows.reduce<DreamLiveConditionRow[]>((conditions, row) => {
		if (row.conditions_type === 8) {
			const existing = conditions.find(
				(condition) => condition.conditions_type === 8,
			);
			if (existing === undefined) {
				conditions.push({
					conditions_type: row.conditions_type,
					conditions_values: [row.conditions_value],
				});
				return conditions;
			}
			existing.conditions_values.push(row.conditions_value);
			return conditions;
		}
		conditions.push({
			conditions_type: row.conditions_type,
			conditions_values: [row.conditions_value],
		});
		return conditions;
	}, []);
}

export function getItemNameById(database: Database, itemId: number): string {
	const row = database
		.query('SELECT name FROM master_items WHERE id = ?')
		.get(itemId) as { name: string } | null;
	if (row === null) {
		throw new Error(`Item not found: ${itemId}`);
	}
	return row.name;
}
