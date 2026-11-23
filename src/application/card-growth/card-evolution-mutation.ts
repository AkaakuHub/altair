import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import type { UserCardTemplateState } from '../../state/user-card-types.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import { createEvolutionMutationPlan } from './card-evolution-preflight.ts';
import type { EvolutionMutationResult } from './card-evolution-result-types.ts';
import { consumeUserItemFromLookup } from './card-growth-items.ts';
import type { CardGrowthMasterSource } from './card-growth-master-source.ts';
import type { CardGrowthMutationGuard } from './card-growth-mutation-guard.ts';

export function applyEvolution(
	masterSource: CardGrowthMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
	mutationGuard: CardGrowthMutationGuard,
	updateCard: (update: {
		dCardDatasId: string;
		nextCard: UserCardTemplateState;
	}) => boolean,
): EvolutionMutationResult {
	const plan = createEvolutionMutationPlan(
		masterSource,
		body,
		cards,
		inventory,
		mutationGuard,
	);
	if (typeof plan === 'string') return plan;
	for (const item of plan.requiredItems)
		if (!consumeUserItemFromLookup(plan.itemLookup, item.itemId, item.costNum))
			return 'insufficientItem';
	if (!updateCard({ dCardDatasId: plan.dCardDatasId, nextCard: plan.nextCard }))
		return 'cardNotFound';
	return 'ok';
}
