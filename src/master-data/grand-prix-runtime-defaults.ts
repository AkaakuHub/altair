import type { Database } from 'bun:sqlite';
import { normalizeUtcDateTime } from './master-date-time.ts';

type GrandPrixMasterRuntimeDefaults = {
	grandPrixType: number;
	startDate: string;
	endDate: string;
	dailyPlayableCount: number;
};

export function getGrandPrixMasterRuntimeDefaultsFromDatabase(
	database: Database,
	grandPrixId: number,
): GrandPrixMasterRuntimeDefaults | undefined {
	const row = database
		.query(
			[
				'SELECT g.grand_prix_type, g.start_time, g.end_time,',
				'COALESCE(MAX(s.play_limit_count), 0) AS play_limit_count',
				'FROM master_grand_prix g',
				'LEFT JOIN master_grand_prix_quest_series s ON s.grand_prixes_id = g.id',
				'WHERE g.id = ?',
				'GROUP BY g.id',
			].join(' '),
		)
		.get(grandPrixId) as {
		grand_prix_type: number;
		start_time: string;
		end_time: string;
		play_limit_count: number;
	} | null;
	if (row === null) {
		return undefined;
	}
	return {
		grandPrixType: row.grand_prix_type,
		startDate: normalizeUtcDateTime(row.start_time),
		endDate: normalizeUtcDateTime(row.end_time),
		dailyPlayableCount: row.play_limit_count,
	};
}
