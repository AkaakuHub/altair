import type { Context } from 'hono';
import { getItemExchangeProvenance } from '../../master-data/shop-exchange-identity.ts';
import { getShopExchangeMasterFromDatabase } from '../active-master-database/shop-exchange-responses.ts';
import { readJson } from '../http/read-json.ts';
import { createItemExchangeListResponse } from '../responses/shop-exchange-response.ts';
import { readItemExchangeCategoryListId } from './item-exchange-request.ts';
import { ensureProjectedItemExchangeInventory } from './item-exchange-session.ts';
import { getRequestUser, persistRouteStateIfChanged } from './route-state.ts';
import { ensureActiveShopExchangeState } from './shop-exchange-route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function getItemExchangeList(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	const categoryListId = readItemExchangeCategoryListId(
		await readJson(c.req.raw),
	);
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
	const exchangeResult = ensureActiveShopExchangeState(
		routeContext,
		user.playerId,
		masterRelease.database,
	);
	const inventory = ensureProjectedItemExchangeInventory(
		routeContext,
		user,
		masterRelease.database,
	);
	const shopMaster = getShopExchangeMasterFromDatabase(masterRelease.database);
	persistRouteStateIfChanged(
		routeContext,
		exchangeResult.created || inventory.created,
	);
	return c.json(
		createItemExchangeListResponse(
			exchangeResult.value,
			inventory.projected,
			shopMaster.itemExchangeList,
			shopMaster.isConvertibleLimitBreakMaterial,
			categoryListId,
			(itemExchangesId) =>
				getItemExchangeProvenance(
					masterRelease.database,
					masterRelease.masterReleaseId,
					itemExchangesId,
				),
		),
	);
}
