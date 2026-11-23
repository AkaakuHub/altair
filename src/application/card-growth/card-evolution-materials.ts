import type { CardEvolutionRequirement } from './card-growth-master-source.ts';
import type { RequiredItemResponse } from './card-growth-response.ts';

type MaterialRequirement = Pick<
	CardEvolutionRequirement,
	| 'costItemId1'
	| 'costNum1'
	| 'costItemId2'
	| 'costNum2'
	| 'costItemId3'
	| 'costNum3'
>;

export function evolutionRequirementItems(
	requirement: MaterialRequirement,
): Array<{ itemId: number; costNum: number }> {
	return [
		{ itemId: requirement.costItemId1, costNum: requirement.costNum1 },
		{ itemId: requirement.costItemId2, costNum: requirement.costNum2 },
		{ itemId: requirement.costItemId3, costNum: requirement.costNum3 },
	].filter((item) => item.itemId > 0 && item.costNum > 0);
}

export function createEvolutionRequiredItem(
	requirement: MaterialRequirement,
): RequiredItemResponse {
	return {
		cost_item_id1: requirement.costItemId1,
		cost_num1: requirement.costNum1,
		cost_item_id2: requirement.costItemId2,
		cost_num2: requirement.costNum2,
		cost_item_id3: requirement.costItemId3,
		cost_num3: requirement.costNum3,
	};
}
