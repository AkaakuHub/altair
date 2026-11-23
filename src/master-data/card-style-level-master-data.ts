import type { Database } from 'bun:sqlite';
import { getCardGrowthRow } from './card-growth-card-data.ts';

type CardLevelCostRow = {
	total_experience: number;
	row_count: number;
};

export function getStyleLevelCost(
	database: Database,
	cardDatasId: number,
	currentLevel: number,
	targetLevel: number,
): number | undefined {
	if (targetLevel <= currentLevel) {
		return undefined;
	}
	const growth = getCardGrowthRow(database, cardDatasId);
	if (!growth) {
		return undefined;
	}
	const row = database
		.query(
			[
				'SELECT SUM(experience) AS total_experience, COUNT(*) AS row_count',
				'FROM master_card_levels',
				'WHERE experience_type = ? AND card_level > ? AND card_level <= ?',
			].join(' '),
		)
		.get(
			growth.experience_type,
			currentLevel,
			targetLevel,
		) as CardLevelCostRow | null;
	const expectedRows = targetLevel - currentLevel;
	if (!row || row.row_count !== expectedRows) {
		return undefined;
	}
	return row.total_experience;
}
