import type { Database } from 'bun:sqlite';
import { normalizeUtcDateTime } from './master-date-time.ts';
import { currentUtcIsoDateTime } from './master-time.ts';

type GradeLiveMasterRuntimeDefaults = {
	activeGradeQuestSeasonId: number;
	startDate: string;
	endDate: string;
	status: number;
};

type GradeLiveSeasonRow = {
	id: number;
	start_time: string;
	end_time: string;
};

export function getCurrentGradeLiveMasterRuntimeDefaultsFromDatabase(
	database: Database,
): GradeLiveMasterRuntimeDefaults {
	const now = currentUtcIsoDateTime();
	const row = database
		.query<GradeLiveSeasonRow, [string, string]>(
			[
				'SELECT id, start_time, end_time',
				'FROM master_grade_quest_season',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id DESC',
				'LIMIT 1',
			].join(' '),
		)
		.get(now, now);
	if (row === null) {
		throw new Error('active grade quest season is not found');
	}
	return gradeLiveMasterRuntimeDefaults(row);
}

export function getGradeLiveMasterRuntimeDefaultsFromDatabase(
	database: Database,
	gradeQuestSeasonId: number,
): GradeLiveMasterRuntimeDefaults | undefined {
	const row = database
		.query<GradeLiveSeasonRow, [number]>(
			[
				'SELECT id, start_time, end_time',
				'FROM master_grade_quest_season',
				'WHERE id = ?',
			].join(' '),
		)
		.get(gradeQuestSeasonId);
	if (row === null) {
		return undefined;
	}
	return gradeLiveMasterRuntimeDefaults(row);
}

function gradeLiveMasterRuntimeDefaults(
	row: GradeLiveSeasonRow,
): GradeLiveMasterRuntimeDefaults {
	return {
		activeGradeQuestSeasonId: row.id,
		startDate: normalizeUtcDateTime(row.start_time),
		endDate: normalizeUtcDateTime(row.end_time),
		status: 1,
	};
}
