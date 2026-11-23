import type { Database } from 'bun:sqlite';
import { normalizeUtcDateTime } from './master-date-time.ts';

type GradeChallengeMasterRuntimeDefaults = {
	activeGradeChallengeSeasonId: number;
	startDate: string;
	endDate: string;
	status: number;
};

type GradeChallengeSeasonRow = {
	id: number;
	start_time: string;
	end_time: string;
};

export function getLatestGradeChallengeMasterRuntimeDefaultsFromDatabase(
	database: Database,
): GradeChallengeMasterRuntimeDefaults {
	const row = database
		.query<GradeChallengeSeasonRow, []>(
			[
				'SELECT id, start_time, end_time',
				'FROM master_grade_chal_season',
				'ORDER BY id DESC',
				'LIMIT 1',
			].join(' '),
		)
		.get();
	if (row === null) {
		throw new Error('grade challenge season is not found');
	}
	return gradeChallengeMasterRuntimeDefaults(row, 0);
}

export function getGradeChallengeMasterRuntimeDefaultsFromDatabase(
	database: Database,
	gradeChallengeSeasonId: number,
): GradeChallengeMasterRuntimeDefaults | undefined {
	const row = database
		.query<GradeChallengeSeasonRow, [number]>(
			[
				'SELECT id, start_time, end_time',
				'FROM master_grade_chal_season',
				'WHERE id = ?',
			].join(' '),
		)
		.get(gradeChallengeSeasonId);
	if (row === null) {
		return undefined;
	}
	return gradeChallengeMasterRuntimeDefaults(row, 1);
}

function gradeChallengeMasterRuntimeDefaults(
	row: GradeChallengeSeasonRow,
	status: number,
): GradeChallengeMasterRuntimeDefaults {
	return {
		activeGradeChallengeSeasonId: row.id,
		startDate: normalizeUtcDateTime(row.start_time),
		endDate: normalizeUtcDateTime(row.end_time),
		status,
	};
}
