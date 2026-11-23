import type { Database } from 'bun:sqlite';
import type { CardSkillLevelUpRequirement } from '../application/card-growth/card-growth-master-source.ts';
import { getCardGrowthRow } from './card-growth-card-data.ts';
import {
	type CardSkillLevelUpMaterialRow,
	mapCardSkillLevelUpRequirement,
} from './card-growth-row-mappers.ts';

export function getSkillLevelUpRequirements(
	database: Database,
	cardDatasId: number,
	skillType: number,
	currentSkillLevel: number,
	targetSkillLevel: number,
): CardSkillLevelUpRequirement[] | undefined {
	if (targetSkillLevel <= currentSkillLevel) {
		return undefined;
	}
	const growth = getCardGrowthRow(database, cardDatasId);
	if (!growth) {
		return undefined;
	}
	const rows = database
		.query(
			[
				'SELECT skill_level, cost_items_id1, cost_num1, cost_items_id2, cost_num2, cost_items_id3, cost_num3',
				'FROM master_card_skill_level_up_materials',
				'WHERE card_series_id = ? AND skill_type = ? AND skill_level >= ? AND skill_level < ?',
				'ORDER BY skill_level',
			].join(' '),
		)
		.all(
			growth.card_series_id,
			skillType,
			currentSkillLevel,
			targetSkillLevel,
		) as CardSkillLevelUpMaterialRow[];
	if (rows.length !== targetSkillLevel - currentSkillLevel) {
		return undefined;
	}
	return rows.map(mapCardSkillLevelUpRequirement);
}
