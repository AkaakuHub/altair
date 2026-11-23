import type {
	CardEvolutionRequirement,
	CardLimitBreakRequirement,
	CardSkillLevelUpRequirement,
} from '../application/card-growth/card-growth-master-source.ts';

export type CardLimitBreakMaterialRow = {
	limit_break_times: number;
	cost_items_id: number;
	cost_num: number;
};

export type CardSkillLevelUpMaterialRow = {
	skill_level: number;
	cost_items_id1: number;
	cost_num1: number;
	cost_items_id2: number;
	cost_num2: number;
	cost_items_id3: number;
	cost_num3: number;
};

export type CardEvolutionMaterialRow = {
	cost_items_id1: number;
	cost_num1: number;
	cost_items_id2: number;
	cost_num2: number;
	cost_items_id3: number;
	cost_num3: number;
};

export function mapCardLimitBreakRequirement(
	row: CardLimitBreakMaterialRow,
): CardLimitBreakRequirement {
	return {
		limitBreakTimes: row.limit_break_times,
		costItemsId: row.cost_items_id,
		costNum: row.cost_num,
	};
}

export function mapCardSkillLevelUpRequirement(
	row: CardSkillLevelUpMaterialRow,
): CardSkillLevelUpRequirement {
	return {
		skillLevel: row.skill_level,
		costItemId1: row.cost_items_id1,
		costNum1: row.cost_num1,
		costItemId2: row.cost_items_id2,
		costNum2: row.cost_num2,
		costItemId3: row.cost_items_id3,
		costNum3: row.cost_num3,
	};
}

export function mapCardEvolutionRequirement(
	nextCardDatasId: number,
	nextMaxStyleLevel: number,
	row: CardEvolutionMaterialRow,
): CardEvolutionRequirement {
	return {
		nextCardDatasId,
		nextMaxStyleLevel,
		costItemId1: row.cost_items_id1,
		costNum1: row.cost_num1,
		costItemId2: row.cost_items_id2,
		costNum2: row.cost_num2,
		costItemId3: row.cost_items_id3,
		costNum3: row.cost_num3,
	};
}

export function getEvolutionValue(
	values: readonly number[],
	evolveTimes: number,
): number | undefined {
	return values[evolveTimes];
}
