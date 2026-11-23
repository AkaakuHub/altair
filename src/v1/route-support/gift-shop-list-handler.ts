import type { Context } from 'hono';
import { projectUserInventory } from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { readJson } from '../http/read-json.ts';
import {
	createGiftShopListForCharactersResponse,
	createGiftShopListResponse,
} from './archive-gift-shop.ts';
import { getStringField } from './request-fields.ts';
import { getRequestUser, persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

type GiftShopKind = 'withlive' | 'withstation' | 'feslive';

export async function getGiftShopList(
	c: Context,
	routeContext: StateRouteContext,
	kind: GiftShopKind,
): Promise<Response> {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const body = await readJson(c.req.raw);
	const inventoryResult = ensureUserInventory(
		routeContext.state,
		user.playerId,
		routeContext.userItemsGetList,
	);
	persistRouteStateIfChanged(routeContext, inventoryResult.created);
	const masterIdField = getGiftShopMasterIdField(kind);
	const database = routeContext.resolveMasterDatabase(c, user);
	const liveId = getStringField(body, masterIdField);
	const inventory = projectUserInventory(
		inventoryResult.value,
		createUserOwnedMasterSupport(database),
	);
	const characters =
		kind === 'withstation'
			? undefined
			: routeContext.resolveGiftShopCharacters?.(kind, liveId);
	if (characters !== undefined)
		return c.json(
			createGiftShopListForCharactersResponse(database, characters, inventory),
		);
	if (kind === 'feslive')
		return routeContext.respondError(c, 'liveBroadcastNotFound');
	return c.json(createGiftShopListResponse(database, liveId, kind, inventory));
}

export function getGiftShopMasterIdField(
	kind: GiftShopKind,
): 'm_withlives_id' | 'm_withstations_id' | 'm_feslives_id' {
	if (kind === 'feslive') return 'm_feslives_id';
	return kind === 'withlive' ? 'm_withlives_id' : 'm_withstations_id';
}
