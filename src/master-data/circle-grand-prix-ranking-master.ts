import type { Database } from 'bun:sqlite';
import type { CircleGrandPrixRankingMaster } from '../application/circle-grand-prix-ranking-service.ts';
import { normalizeUtcDateTime } from './master-date-time.ts';

type GrandPrixRankingRow = {
	id: number;
	name: string;
	start_time: string;
};

export function getCircleGrandPrixRankingMasterById(
	database: Database,
	grandPrixId: number,
): CircleGrandPrixRankingMaster {
	return toCircleGrandPrixRankingMaster(
		getGrandPrixRankingRow(database, grandPrixId),
	);
}

export function getPreviousCircleGrandPrixRankingMaster(
	database: Database,
	startDate: string,
): CircleGrandPrixRankingMaster {
	const previous = database
		.query<GrandPrixRankingRow, [string]>(
			[
				'SELECT id, name, start_time',
				'FROM master_grand_prix',
				'WHERE grand_prix_type = 2',
				'AND datetime(start_time) < datetime(?)',
				'ORDER BY datetime(start_time) DESC',
				'LIMIT 1',
			].join(' '),
		)
		.get(startDate);
	if (previous === null) {
		throw new Error('Previous circle grand prix master not found');
	}
	return toCircleGrandPrixRankingMaster(previous);
}

function getGrandPrixRankingRow(
	database: Database,
	grandPrixId: number,
): GrandPrixRankingRow {
	const row = database
		.query<GrandPrixRankingRow, [number]>(
			'SELECT id, name, start_time FROM master_grand_prix WHERE id = ?',
		)
		.get(grandPrixId);
	if (row === null) {
		throw new Error(`Grand prix master not found: ${grandPrixId}`);
	}
	return row;
}

function toCircleGrandPrixRankingMaster(
	row: GrandPrixRankingRow,
): CircleGrandPrixRankingMaster {
	return {
		grandPrixId: row.id,
		name: row.name,
		month: new Date(normalizeUtcDateTime(row.start_time)).getUTCMonth() + 1,
	};
}
