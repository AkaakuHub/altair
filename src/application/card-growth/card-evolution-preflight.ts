import {
	findUserCard,
	type UserCardCollectionState,
} from '../../state/user-card-aggregate-state.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import { evolutionRequirementItems } from './card-evolution-materials.ts';
import type {
	EvolutionMutationPlan,
	EvolutionMutationResult,
} from './card-evolution-result-types.ts';
import {
	createUserItemLookup,
	getCardGrowthNumberField,
	getCardGrowthStringField,
	getOwnItemNum,
} from './card-growth-items.ts';
import type { CardGrowthMasterSource } from './card-growth-master-source.ts';
import type { CardGrowthMutationGuard } from './card-growth-mutation-guard.ts';

export function createEvolutionMutationPlan(
	masterSource: CardGrowthMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
	mutationGuard: CardGrowthMutationGuard,
): EvolutionMutationPlan | Exclude<EvolutionMutationResult, 'ok'> {
	const dCardDatasId = getCardGrowthStringField(body, 'd_card_datas_id');
	const card = findUserCard(cards, dCardDatasId);
	if (!card) return 'cardNotFound';
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	if (cardDatasId === undefined) return 'cardNotFound';
	const requirement = masterSource.getEvolutionRequirement(cardDatasId);
	if (requirement === undefined) return 'masterDataNotFound';
	if (requirement === 'maxEvolution') return 'unavailable';
	const requiredItems = evolutionRequirementItems(requirement);
	const itemLookup = createUserItemLookup(inventory);
	if (
		requiredItems.some(
			(item) => getOwnItemNum(itemLookup, item.itemId) < item.costNum,
		)
	)
		return 'insufficientItem';
	const mutationItems = requiredItems.map((item) =>
		itemLookup.get(item.itemId),
	);
	if (
		mutationItems.some((item) => item === undefined) ||
		!mutationGuard.preflight(
			card,
			mutationItems.filter((item) => item !== undefined),
		)
	)
		return 'incompatibleDefinition';
	const nextCard = masterSource.getCardTemplate(requirement.nextCardDatasId);
	if (!nextCard) return 'masterDataNotFound';
	return { dCardDatasId, nextCard, itemLookup, requiredItems };
}
