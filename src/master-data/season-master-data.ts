import type { Database } from 'bun:sqlite';

export type SeasonMasterEntry = {
	seasonId: number;
	name: string;
	startTime: string;
	endTime: string;
	isSeasonFanLv: boolean;
};

type SeasonMasterRow = {
	id: number;
	name: string;
	start_time: string;
	end_time: string;
	is_season_fan_lv: number;
};

export function getSeasonMasterEntriesFromDatabase(
	database: Database,
): SeasonMasterEntry[] {
	const rows = database
		.query(
			[
				'SELECT id, name, start_time, end_time, is_season_fan_lv',
				'FROM master_seasons',
				'ORDER BY id',
			].join(' '),
		)
		.all() as SeasonMasterRow[];
	return rows.map((row) => ({
		seasonId: row.id,
		name: row.name,
		startTime: row.start_time,
		endTime: row.end_time,
		isSeasonFanLv: row.is_season_fan_lv === 1,
	}));
}
