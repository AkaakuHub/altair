import type { Database } from 'bun:sqlite';
import type { CardGrowthMasterSource } from '../../application/card-growth/card-growth-master-source.ts';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import { getEvolutionRequirement } from '../../master-data/card-evolution-master-data.ts';
import { getLimitBreakRequirements } from '../../master-data/card-limit-break-master-data.ts';
import { getSkillLevelUpRequirements } from '../../master-data/card-skill-level-master-data.ts';
import { getStyleLevelCost } from '../../master-data/card-style-level-master-data.ts';

export function createCardGrowthMasterSource(
	database: Database,
): CardGrowthMasterSource {
	return {
		getStyleLevelCost: (cardDatasId, currentLevel, targetLevel) =>
			getStyleLevelCost(database, cardDatasId, currentLevel, targetLevel),
		getLimitBreakRequirements: (
			cardDatasId,
			currentLimitBreakTimes,
			targetLimitBreakTimes,
		) =>
			getLimitBreakRequirements(
				database,
				cardDatasId,
				currentLimitBreakTimes,
				targetLimitBreakTimes,
			),
		getSkillLevelUpRequirements: (
			cardDatasId,
			skillType,
			currentSkillLevel,
			targetSkillLevel,
		) =>
			getSkillLevelUpRequirements(
				database,
				cardDatasId,
				skillType,
				currentSkillLevel,
				targetSkillLevel,
			),
		getEvolutionRequirement: (cardDatasId) =>
			getEvolutionRequirement(database, cardDatasId),
		getCardTemplate: (cardDatasId) =>
			getCardDetailTemplateByCardDatasIdFromDatabase(database, cardDatasId),
	};
}
