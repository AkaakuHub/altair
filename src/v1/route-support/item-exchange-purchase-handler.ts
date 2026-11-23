import type { Context } from 'hono';
import { getItemIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import { getItemExchangeProvenance } from '../../master-data/shop-exchange-identity.ts';
import { getItemExchangePurchaseMasterFromDatabase } from '../../master-data/shop-exchange-purchase-master.ts';
import {
	findItemExchangeState,
	getOrCreateUserItemExchangeState,
} from '../../state/shop-item-exchange-progress.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import {
	addUserItemQuantity,
	canApplyUserItemProvenance,
	consumeUserItem,
} from '../../state/user-item-mutation.ts';
import { readJson } from '../http/read-json.ts';
import type { ItemExchangePurchaseResponse } from '../response-types/shop-inventory-response-types.ts';
import { createMasterReleaseItemProvenance } from './item-consumption.ts';
import { readItemExchangePurchaseRequest } from './item-exchange-request.ts';
import { ensureItemExchangeInventory } from './item-exchange-session.ts';
import { canReceiveItemFromDatabase } from './item-receive-availability.ts';
import { getRequestUser, persistRouteState } from './route-state.ts';
import { ensureActiveShopExchangeState } from './shop-exchange-route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function purchaseItemExchange(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	const request = readItemExchangePurchaseRequest(await readJson(c.req.raw));
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	if (request === undefined)
		return routeContext.respondError(c, 'itemExchangeInvalid');
	const { itemExchangesId, num } = request;
	const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
	const master = getItemExchangePurchaseMasterFromDatabase(
		masterRelease.database,
		itemExchangesId,
	);
	if (!master) return routeContext.respondError(c, 'itemExchangeNotFound');
	const productDefinition = getItemDefinitionByItemIdFromDatabase(
		masterRelease.database,
		master.productItemId,
	);
	if (!productDefinition)
		return routeContext.respondError(c, 'itemExchangeItemDefinitionNotFound');
	const exchange = ensureActiveShopExchangeState(
		routeContext,
		user.playerId,
		masterRelease.database,
	).value;
	const exchangeProvenance = getItemExchangeProvenance(
		masterRelease.database,
		masterRelease.masterReleaseId,
		itemExchangesId,
	);
	if (exchangeProvenance === undefined)
		return routeContext.respondError(c, 'itemExchangeNotFound');
	const exchangeItem = findItemExchangeState(
		exchange,
		itemExchangesId,
		exchangeProvenance,
	);
	if (
		exchangeItem?.isLock ||
		((exchangeItem?.remainingExchangeNum ?? 0) > 0 &&
			exchangeItem !== undefined &&
			exchangeItem.remainingExchangeNum < num)
	)
		return routeContext.respondError(c, 'itemExchangeInvalid');

	const inventory = ensureItemExchangeInventory(routeContext, user).value;
	const identityFingerprint = getItemIdentityFingerprint(
		masterRelease.database,
		productDefinition.itemId,
	);
	const productProvenance =
		identityFingerprint === undefined
			? undefined
			: {
					sourceMasterReleaseId: masterRelease.masterReleaseId,
					identityFingerprint,
				};
	if (
		productProvenance === undefined ||
		!canApplyUserItemProvenance(
			inventory,
			productDefinition.itemId,
			productProvenance,
		) ||
		!canReceiveItemFromDatabase(
			masterRelease.database,
			inventory,
			master.productItemId,
			master.productItemNum * num,
		)
	)
		return routeContext.respondError(c, 'itemExchangeInvalid');
	const materialProvenance = createMasterReleaseItemProvenance(
		masterRelease.database,
		masterRelease.masterReleaseId,
		master.materialItemId,
	);
	if (
		materialProvenance === undefined ||
		!consumeUserItem(
			inventory,
			'',
			master.materialItemId,
			master.materialItemNum * num,
			materialProvenance,
		)
	)
		return routeContext.respondError(c, 'userItemInsufficient');
	const productItem = addUserItemQuantity(
		routeContext.state,
		user.playerId,
		productDefinition,
		master.productItemNum * num,
		productProvenance,
	);
	if (!productItem)
		return routeContext.respondError(c, 'itemExchangeItemDefinitionNotFound');
	const purchasedExchangeItem = getOrCreateUserItemExchangeState(
		exchange,
		itemExchangesId,
		exchangeProvenance,
	);
	if (purchasedExchangeItem.remainingExchangeNum > 0)
		purchasedExchangeItem.remainingExchangeNum -= num;
	persistRouteState(routeContext);
	return c.json({
		user_material_item_num:
			findUserItemByItemId(inventory, master.materialItemId)?.itemNum ?? 0,
		user_product_item_num: productItem.itemNum,
	} satisfies ItemExchangePurchaseResponse);
}
