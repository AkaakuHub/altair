import {
	findUserCard,
	type UserCardCollectionState,
} from '../../state/user-card-aggregate-state.ts';
import type { UserCardDataState } from '../../state/user-card-types.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import {
	createEvolutionRequiredItem,
	evolutionRequirementItems,
} from './card-evolution-materials.ts';
import type { EvolutionAvailability } from './card-evolution-result-types.ts';
import {
	createUserItemLookup,
	getCardGrowthNumberField,
	getCardGrowthStringField,
	getOwnItemNum,
	type UserItemLookup,
} from './card-growth-items.ts';
import type { CardGrowthMasterSource } from './card-growth-master-source.ts';
import type { EvolutionCheckResponse } from './card-growth-response.ts';

export function applyEvolutionAvailability(
	masterSource: CardGrowthMasterSource,
	card: UserCardDataState,
	inventory: UserInventoryState,
): boolean {
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const currentStyleLevel = getCardGrowthNumberField(card, 'style_level');
	const currentMaxStyleLevel = getCardGrowthNumberField(
		card,
		'max_style_level',
	);
	if (
		cardDatasId === undefined ||
		currentStyleLevel === undefined ||
		currentMaxStyleLevel === undefined
	) {
		return false;
	}
	const availability = getEvolutionAvailability(
		masterSource,
		cardDatasId,
		currentMaxStyleLevel,
		createUserItemLookup(inventory),
	);
	if (availability === undefined) {
		if (!masterSource.getCardTemplate(cardDatasId)) {
			return false;
		}
		card.is_evolve_max = false;
		card.is_evolve_possible = false;
		return true;
	}
	card.is_evolve_max = availability.kind === 'max';
	card.is_evolve_possible =
		availability.kind === 'next' &&
		currentStyleLevel >= currentMaxStyleLevel &&
		availability.isPossible;
	return true;
}

export function createCheckEvolutionResponse(
	masterSource: CardGrowthMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
): EvolutionCheckResponse | 'masterDataNotFound' | undefined {
	const dCardDatasId = getCardGrowthStringField(body, 'd_card_datas_id');
	const card = findUserCard(cards, dCardDatasId);
	if (!card) {
		return undefined;
	}
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const currentMaxStyleLevel = getCardGrowthNumberField(
		card,
		'max_style_level',
	);
	if (cardDatasId === undefined || currentMaxStyleLevel === undefined) {
		return undefined;
	}
	const itemLookup = createUserItemLookup(inventory);
	const availability = getEvolutionAvailability(
		masterSource,
		cardDatasId,
		currentMaxStyleLevel,
		itemLookup,
	);
	if (availability === undefined) {
		return 'masterDataNotFound';
	}
	return {
		is_possible: availability.isPossible,
		user_item_list: availability.requiredItems.map((item) => ({
			item_id: item.itemId,
			own_num: getOwnItemNum(itemLookup, item.itemId),
		})),
		required_item_list:
			availability.kind === 'max'
				? []
				: [createEvolutionRequiredItem(availability.requirement)],
		next_max_style_level: availability.nextMaxStyleLevel,
	};
}

function getEvolutionAvailability(
	masterSource: CardGrowthMasterSource,
	cardDatasId: number,
	currentMaxStyleLevel: number,
	itemLookup: UserItemLookup,
): EvolutionAvailability | undefined {
	const requirement = masterSource.getEvolutionRequirement(cardDatasId);
	if (requirement === undefined) {
		return undefined;
	}
	if (requirement === 'maxEvolution') {
		return {
			kind: 'max',
			isPossible: false,
			nextMaxStyleLevel: currentMaxStyleLevel,
			requiredItems: [],
		};
	}
	const requiredItems = evolutionRequirementItems(requirement);
	return {
		kind: 'next',
		isPossible: requiredItems.every(
			(item) => getOwnItemNum(itemLookup, item.itemId) >= item.costNum,
		),
		nextMaxStyleLevel: requirement.nextMaxStyleLevel,
		requiredItems,
		requirement,
	};
}
