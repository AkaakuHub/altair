import type { Context } from 'hono';
import { createLimitBreakMaterialConvertListResponse } from '../responses/shop-exchange-response.ts';
import {
	ensureItemExchangeInventory,
	ensureProjectedItemExchangeInventory,
} from './item-exchange-session.ts';
import { convertLimitBreakMaterialsToItems } from './limit-break-material-convert.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getLimitBreakMaterialConvertList(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const database = routeContext.resolveMasterDatabase(c, user);
	const inventory = ensureProjectedItemExchangeInventory(
		routeContext,
		user,
		database,
	);
	persistRouteStateIfChanged(routeContext, inventory.created);
	return c.json(
		createLimitBreakMaterialConvertListResponse(database, inventory.projected),
	);
}

export function convertLimitBreakMaterials(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
	const inventory = ensureItemExchangeInventory(routeContext, user).value;
	const getItemList = convertLimitBreakMaterialsToItems(
		masterRelease.database,
		masterRelease.masterReleaseId,
		routeContext.state,
		user.playerId,
		inventory,
	);
	if (!getItemList)
		return routeContext.respondError(c, 'itemExchangeItemDefinitionNotFound');
	persistRouteState(routeContext);
	return c.json({ get_item_list: getItemList });
}
