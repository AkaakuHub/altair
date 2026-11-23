import type { Database } from 'bun:sqlite';
import { projectUserInventory } from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function ensureProjectedItemExchangeInventory(
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	database: Database,
) {
	const result = ensureItemExchangeInventory(routeContext, user);
	return {
		created: result.created,
		canonical: result.value,
		projected: projectUserInventory(
			result.value,
			createUserOwnedMasterSupport(database),
		),
	};
}

export function ensureItemExchangeInventory(
	routeContext: StateRouteContext,
	user: RegisteredUserState,
) {
	return ensureUserInventory(
		routeContext.state,
		user.playerId,
		routeContext.userItemsGetList,
	);
}
