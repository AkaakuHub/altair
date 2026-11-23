import type { Database } from 'bun:sqlite';
import type { CardLimitBreakRequirement } from '../application/card-growth/card-growth-master-source.ts';
import { getCardGrowthRow } from './card-growth-card-data.ts';
import {
	type CardLimitBreakMaterialRow,
	mapCardLimitBreakRequirement,
} from './card-growth-row-mappers.ts';

export function getLimitBreakRequirements(
	database: Database,
	cardDatasId: number,
	currentLimitBreakTimes: number,
	targetLimitBreakTimes: number,
): CardLimitBreakRequirement[] | undefined {
	if (targetLimitBreakTimes <= currentLimitBreakTimes) {
		return undefined;
	}
	const growth = getCardGrowthRow(database, cardDatasId);
	if (!growth) {
		return undefined;
	}
	const rows = database
		.query(
			[
				'SELECT limit_break_times, cost_items_id, cost_num',
				'FROM master_card_limit_break_materials',
				'WHERE card_series_id = ? AND limit_break_times > ? AND limit_break_times <= ?',
				'ORDER BY limit_break_times',
			].join(' '),
		)
		.all(
			growth.card_series_id,
			currentLimitBreakTimes,
			targetLimitBreakTimes,
		) as CardLimitBreakMaterialRow[];
	if (rows.length !== targetLimitBreakTimes - currentLimitBreakTimes) {
		return undefined;
	}
	return rows.map(mapCardLimitBreakRequirement);
}
