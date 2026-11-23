import { Hono } from 'hono';
import {
	projectUserCards,
	projectUserInventory,
} from '../../application/user-owned-master-projection.ts';
import { getGpPrizeExchangeProvenance } from '../../master-data/shop-exchange-identity.ts';
import { getGpPrizeExchangePurchaseMasterFromDatabase } from '../../master-data/shop-exchange-purchase-master.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { consumeUserItem } from '../../state/user-item-mutation.ts';
import { getShopExchangeMasterFromDatabase } from '../active-master-database/shop-exchange-responses.ts';
import { readJson } from '../http/read-json.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { GpPrizeExchangePurchaseRequest } from '../response-types/shop-inventory-request-types.ts';
import type {
	GpPrizeExchangeListResponse,
	GpPrizeExchangePurchaseResponse,
} from '../response-types/shop-inventory-response-types.ts';
import {
	createGpPrizeExchangeListResponse,
	createGpPrizeExchangePurchaseResponse,
} from '../responses/shop-exchange-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { resolveGpPrizeExchangeProductPurchase } from '../route-support/gp-prize-exchange-purchase.ts';
import { createMasterReleaseItemProvenance } from '../route-support/item-consumption.ts';
import { getNumberField } from '../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import { ensureActiveShopExchangeState } from '../route-support/shop-exchange-route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createGpPrizeExchangeRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { state, userCardGetList, userItemsGetList } = routeContext;

	typedEndpoint<EmptyRequest, GpPrizeExchangeListResponse>({
		requiresSession: true,
	});
	app.post('/v1/gp_prize_exchange/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const masterSupport = createUserOwnedMasterSupport(database);
		const exchangeResult = ensureActiveShopExchangeState(
			routeContext,
			user.playerId,
			database,
		);
		const exchange = exchangeResult.value;
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const inventory = projectUserInventory(
			inventoryResult.value,
			masterSupport,
		);
		const userCardsResult = ensureUserCards(
			state,
			user.playerId,
			userCardGetList,
		);
		const userCards = projectUserCards(userCardsResult.value, masterSupport);
		const shopMaster = getShopExchangeMasterFromDatabase(database);
		persistRouteStateIfChanged(
			routeContext,
			exchangeResult.created ||
				inventoryResult.created ||
				userCardsResult.created,
		);
		return c.json(
			createGpPrizeExchangeListResponse(
				database,
				exchange,
				inventory,
				shopMaster.gpPrizeExchangeList,
				userCards,
				(gpPrizeExchangesId) =>
					getGpPrizeExchangeProvenance(
						database,
						masterRelease.masterReleaseId,
						gpPrizeExchangesId,
					),
			),
		);
	});

	typedEndpoint<
		GpPrizeExchangePurchaseRequest,
		GpPrizeExchangePurchaseResponse
	>({ requiresSession: true });
	app.post('/v1/gp_prize_exchange/set_purchase', async (c) => {
		const body = await readJson(c.req.raw);
		const gpPrizeExchangesId = getNumberField(body, 'gp_prize_exchanges_id');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		if (gpPrizeExchangesId === undefined) {
			return routeContext.respondError(c, 'gpPrizeExchangeInvalid');
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const master = getGpPrizeExchangePurchaseMasterFromDatabase(
			database,
			gpPrizeExchangesId,
		);
		if (!master) {
			return routeContext.respondError(c, 'gpPrizeExchangeNotFound');
		}
		const exchange = ensureActiveShopExchangeState(
			routeContext,
			user.playerId,
			database,
		).value;
		const exchangeProvenance = getGpPrizeExchangeProvenance(
			database,
			masterRelease.masterReleaseId,
			gpPrizeExchangesId,
		);
		if (exchangeProvenance === undefined) {
			return routeContext.respondError(c, 'gpPrizeExchangeNotFound');
		}
		const { value: inventory } = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const productPurchase = resolveGpPrizeExchangeProductPurchase(
			database,
			masterRelease.masterReleaseId,
			state,
			user.playerId,
			userCardGetList,
			exchange,
			master,
			exchangeProvenance,
		);
		if (!productPurchase) {
			return routeContext.respondError(c, 'gpPrizeExchangeNotFound');
		}
		const materialProvenance = createMasterReleaseItemProvenance(
			database,
			masterRelease.masterReleaseId,
			master.materialItemId,
		);
		if (
			materialProvenance === undefined ||
			!consumeUserItem(
				inventory,
				'',
				master.materialItemId,
				master.materialItemNum,
				materialProvenance,
			)
		) {
			return routeContext.respondError(c, 'gpPrizeTicketInsufficient');
		}
		if (!productPurchase.apply()) {
			return routeContext.respondError(c, 'gpPrizeExchangeNotFound');
		}
		persistRouteState(routeContext);
		return c.json(
			createGpPrizeExchangePurchaseResponse(inventory, master.materialItemId),
		);
	});

	return app;
}
