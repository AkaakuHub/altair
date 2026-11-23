import type { Database } from 'bun:sqlite';
import { normalizeUtcDateTime } from './master-date-time.ts';

export type GradeLiveAdminSummaryMaster = {
	gradeQuestSeasonId: number;
	name: string;
	orderId: number;
	generation: number;
	season: number;
	startDate: string;
	endDate: string;
};

type GradeLiveSummaryRow = {
	id: number;
	name: string;
	order_id: number;
	generation: number;
	season: number;
	start_time: string;
	end_time: string;
};

export function getGradeLiveAdminSummaryFromDatabase(
	database: Database,
): GradeLiveAdminSummaryMaster[] {
	const rows = database
		.query<GradeLiveSummaryRow, []>(
			[
				'SELECT id, name, order_id, generation, season, start_time, end_time',
				'FROM master_grade_quest_season',
				'ORDER BY order_id DESC',
			].join(' '),
		)
		.all();
	return rows.map((row) => ({
		gradeQuestSeasonId: row.id,
		name: row.name,
		orderId: row.order_id,
		generation: row.generation,
		season: row.season,
		startDate: normalizeUtcDateTime(row.start_time),
		endDate: normalizeUtcDateTime(row.end_time),
	}));
}
