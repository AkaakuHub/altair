import type { Database } from 'bun:sqlite';
import { normalizeUtcDateTime } from './master-date-time.ts';

export type GradeChallengeAdminSummaryMaster = {
	gradeChallengeSeasonId: number;
	name: string;
	giveSeasonGradeId: number;
	bgImageId: number;
	startDate: string;
	endDate: string;
	isRankingPrize: number;
};

type GradeChallengeSummaryRow = {
	id: number;
	name: string;
	give_season_grade_id: number;
	bg_image_id: number;
	start_time: string;
	end_time: string;
	is_ranking_prize: number;
};

export function getGradeChallengeAdminSummaryFromDatabase(
	database: Database,
): GradeChallengeAdminSummaryMaster[] {
	const rows = database
		.query<GradeChallengeSummaryRow, []>(
			[
				'SELECT id, name, give_season_grade_id, bg_image_id, start_time, end_time, is_ranking_prize',
				'FROM master_grade_chal_season',
				'ORDER BY id DESC',
			].join(' '),
		)
		.all();
	return rows.map((row) => ({
		gradeChallengeSeasonId: row.id,
		name: row.name,
		giveSeasonGradeId: row.give_season_grade_id,
		bgImageId: row.bg_image_id,
		startDate: normalizeUtcDateTime(row.start_time),
		endDate: normalizeUtcDateTime(row.end_time),
		isRankingPrize: row.is_ranking_prize,
	}));
}
