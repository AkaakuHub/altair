import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function ensureCardGrowthRouteState(
	routeContext: StateRouteContext,
	playerId: string,
) {
	return {
		cards: ensureUserCards(
			routeContext.state,
			playerId,
			routeContext.userCardGetList,
		),
		inventory: ensureUserInventory(
			routeContext.state,
			playerId,
			routeContext.userItemsGetList,
		),
	};
}
