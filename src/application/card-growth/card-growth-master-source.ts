import type { UserCardTemplateState } from '../../state/user-card-types.ts';

export type CardLimitBreakRequirement = {
	limitBreakTimes: number;
	costItemsId: number;
	costNum: number;
};

export type CardSkillLevelUpRequirement = {
	skillLevel: number;
	costItemId1: number;
	costNum1: number;
	costItemId2: number;
	costNum2: number;
	costItemId3: number;
	costNum3: number;
};

export type CardEvolutionRequirement = {
	nextCardDatasId: number;
	nextMaxStyleLevel: number;
	costItemId1: number;
	costNum1: number;
	costItemId2: number;
	costNum2: number;
	costItemId3: number;
	costNum3: number;
};

export interface CardGrowthMasterSource {
	getStyleLevelCost(
		cardDatasId: number,
		currentLevel: number,
		targetLevel: number,
	): number | undefined;
	getLimitBreakRequirements(
		cardDatasId: number,
		currentLimitBreakTimes: number,
		targetLimitBreakTimes: number,
	): CardLimitBreakRequirement[] | undefined;
	getSkillLevelUpRequirements(
		cardDatasId: number,
		skillType: number,
		currentSkillLevel: number,
		targetSkillLevel: number,
	): CardSkillLevelUpRequirement[] | undefined;
	getEvolutionRequirement(
		cardDatasId: number,
	): CardEvolutionRequirement | 'maxEvolution' | undefined;
	getCardTemplate(cardDatasId: number): UserCardTemplateState | undefined;
}
