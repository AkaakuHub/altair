import type { Database } from 'bun:sqlite';
import { ensureUserShopExchangeState } from '../../state/shop-exchange-aggregate.ts';
import { getShopExchangeMasterFromDatabase } from '../active-master-database/shop-exchange-responses.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function ensureActiveShopExchangeState(
	routeContext: StateRouteContext,
	playerId: string,
	database: Database,
) {
	const master = getShopExchangeMasterFromDatabase(database);
	const stateResult = ensureUserShopExchangeState(
		routeContext.state,
		playerId,
		master,
	);
	return { ...stateResult, master };
}
