import { applyEvolutionAvailability } from '../../application/card-growth/card-evolution-plan.ts';
import type { CardGrowthMasterSource } from '../../application/card-growth/card-growth-master-source.ts';
import { applyLimitBreakAvailability } from '../../application/card-growth/card-limit-break-service.ts';
import { applyStyleLevelUpAvailability } from '../../application/card-growth/card-style-level-service.ts';
import type { UserCardDataState } from '../../state/user-card-types.ts';
import { isUserCardDataState } from '../../state/user-card-validator.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import type {
	UserCardDetailResponse,
	UserCardsResponse,
} from '../response-types/user-card-deck-response-types.ts';

export function applyTrainingFlagsToCardResponse(
	masterSource: CardGrowthMasterSource,
	response: UserCardDetailResponse,
	inventory: UserInventoryState,
): boolean {
	if (!isUserCardDataState(response.user_card_data)) {
		return false;
	}
	return applyTrainingFlagsToCard(
		masterSource,
		response.user_card_data,
		inventory,
	);
}

export function applyTrainingFlagsToCardListResponse(
	masterSource: CardGrowthMasterSource,
	response: UserCardsResponse,
	inventory: UserInventoryState,
): boolean {
	if (!Array.isArray(response.user_card_data_list)) {
		return false;
	}
	for (const card of response.user_card_data_list) {
		if (
			!isUserCardDataState(card) ||
			!applyTrainingFlagsToCard(masterSource, card, inventory)
		) {
			return false;
		}
	}
	return true;
}

function applyTrainingFlagsToCard(
	masterSource: CardGrowthMasterSource,
	card: UserCardDataState,
	inventory: UserInventoryState,
): boolean {
	if (!applyLimitBreakAvailability(masterSource, card, inventory)) {
		return false;
	}
	if (!applyStyleLevelUpAvailability(masterSource, card, inventory)) {
		return false;
	}
	return applyEvolutionAvailability(masterSource, card, inventory);
}
