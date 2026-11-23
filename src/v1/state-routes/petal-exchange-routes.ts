import { Hono } from 'hono';
import {
	projectUserCards,
	projectUserInventory,
} from '../../application/user-owned-master-projection.ts';
import { getItemIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import {
	calculatePetalExchangeCostFromDatabase,
	getPetalExchangeCardBySeriesIdFromDatabase,
	getPetalExchangeIdentityFingerprint,
} from '../../master-data/petal-exchange-master.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import {
	addPetalExchangePurchase,
	getPetalExchangePurchaseTotal,
} from '../../state/shop-petal-purchase-progress.ts';
import {
	findUserCards,
	hasUserCardSeries,
} from '../../state/user-card-aggregate-state.ts';
import { markPetalExchangeNewArrivalRead } from '../../state/user-header-state.ts';
import {
	ensureUserInventory,
	findUserItemByItemId,
} from '../../state/user-inventory-aggregate.ts';
import {
	addUserItemQuantity,
	canApplyUserItemProvenance,
	consumeUserItem,
} from '../../state/user-item-mutation.ts';
import { readJson } from '../http/read-json.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { PetalExchangePurchaseRequest } from '../response-types/shop-inventory-request-types.ts';
import type { PetalExchangeListResponse } from '../response-types/shop-inventory-response-types.ts';
import { createPetalExchangeListResponse } from '../responses/shop-exchange-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { createMasterReleaseItemProvenance } from '../route-support/item-consumption.ts';
import { getNumberField } from '../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import { ensureActiveShopExchangeState } from '../route-support/shop-exchange-route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

const PETAL_COIN_ITEM_ID = 3007001;

export function createPetalExchangeRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, state, userItemsGetList } = routeContext;

	typedEndpoint<EmptyRequest, PetalExchangeListResponse>({
		requiresSession: true,
	});
	app.post('/v1/petal_exchange/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const database = routeContext.resolveMasterDatabase(c, user);
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
		const canonicalCards = findUserCards(state, user.playerId);
		const cards =
			canonicalCards === undefined
				? undefined
				: projectUserCards(canonicalCards, masterSupport);
		const isPetalExchangeNewArrivalRead = markPetalExchangeNewArrivalRead(
			state,
			user.playerId,
		);
		persistRouteStateIfChanged(
			routeContext,
			exchangeResult.created ||
				inventoryResult.created ||
				isPetalExchangeNewArrivalRead,
		);
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json(
			createPetalExchangeListResponse(
				database,
				exchange,
				cards,
				inventory,
				findUserItemByItemId(inventory, PETAL_COIN_ITEM_ID)?.itemNum ?? 0,
			),
		);
	});

	typedEndpoint<PetalExchangePurchaseRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/petal_exchange/set_purchase', async (c) => {
		const body = await readJson(c.req.raw);
		const cardSeriesId = getNumberField(body, 'card_series_id');
		const num = getNumberField(body, 'num');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		if (cardSeriesId === undefined || num === undefined || num <= 0) {
			return routeContext.respondError(c, 'petalExchangePurchaseInvalid');
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const userCards = findUserCards(state, user.playerId);
		if (!userCards || !hasUserCardSeries(userCards, cardSeriesId)) {
			return routeContext.respondError(c, 'petalExchangeCardNotFound');
		}
		const cardMaster = getPetalExchangeCardBySeriesIdFromDatabase(
			database,
			cardSeriesId,
		);
		if (!cardMaster) {
			return routeContext.respondError(c, 'petalExchangeCardNotFound');
		}
		const exchange = ensureActiveShopExchangeState(
			routeContext,
			user.playerId,
			database,
		).value;
		const exchangeProvenance = {
			sourceMasterReleaseId: masterRelease.masterReleaseId,
			identityFingerprint: getPetalExchangeIdentityFingerprint(cardMaster),
		};
		const { value: inventory } = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const currentTotal = getPetalExchangePurchaseTotal(
			exchange,
			cardSeriesId,
			exchangeProvenance.identityFingerprint,
		);
		const cost = calculatePetalExchangeCostFromDatabase(
			database,
			cardMaster.rarity,
			currentTotal,
			num,
		);
		if (cost === undefined) {
			return routeContext.respondError(c, 'petalExchangeRateNotFound');
		}
		const itemDefinition = getItemDefinitionByItemIdFromDatabase(
			database,
			cardMaster.materialItemId,
		);
		if (!itemDefinition) {
			return routeContext.respondError(c, 'petalExchangeMaterialNotFound');
		}
		const identityFingerprint = getItemIdentityFingerprint(
			database,
			itemDefinition.itemId,
		);
		if (
			identityFingerprint === undefined ||
			!canApplyUserItemProvenance(inventory, itemDefinition.itemId, {
				sourceMasterReleaseId: masterRelease.masterReleaseId,
				identityFingerprint,
			})
		) {
			return routeContext.respondError(c, 'petalExchangeMaterialNotFound');
		}
		const coinProvenance = createMasterReleaseItemProvenance(
			database,
			masterRelease.masterReleaseId,
			PETAL_COIN_ITEM_ID,
		);
		if (
			coinProvenance === undefined ||
			!consumeUserItem(inventory, '', PETAL_COIN_ITEM_ID, cost, coinProvenance)
		) {
			return routeContext.respondError(c, 'petalCoinInsufficient');
		}
		if (
			!addPetalExchangePurchase(exchange, cardSeriesId, num, exchangeProvenance)
		) {
			return routeContext.respondError(c, 'petalExchangePurchaseInvalid');
		}
		addUserItemQuantity(state, user.playerId, itemDefinition, num, {
			sourceMasterReleaseId: masterRelease.masterReleaseId,
			identityFingerprint,
		});
		persistRouteState(routeContext);
		return c.json({ result: true } satisfies ResultResponse);
	});

	return app;
}
