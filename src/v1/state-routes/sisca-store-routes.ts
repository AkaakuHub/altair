import { Hono } from 'hono';
import { projectUserInventory } from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureUserSiscaStore } from '../../state/sisca-store-state.ts';
import { markSiscaShopNewArrivalRead } from '../../state/user-header-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { getSiscaStoreMasterFromDatabase } from '../active-master-database/sisca-store-responses.ts';
import { readJson } from '../http/read-json.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { SiscaStorePurchaseRequest } from '../response-types/shop-inventory-request-types.ts';
import type {
	SiscaStoreListResponse,
	SiscaStorePurchaseResponse,
} from '../response-types/shop-inventory-response-types.ts';
import {
	createSiscaStoreListResponse,
	createSiscaStorePurchaseResponse,
} from '../responses/sisca-store-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { getNumberField } from '../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import { purchaseSiscaStoreItemForUser } from '../route-support/sisca-store-purchase.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createSiscaStoreRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, state, userItemsGetList } = routeContext;

	typedEndpoint<EmptyRequest, SiscaStoreListResponse>({
		requiresSession: true,
	});
	app.post('/v1/sisca_store/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const master = getSiscaStoreMasterFromDatabase(database);
		const storeResult = ensureUserSiscaStore(state, user.playerId, master);
		const store = storeResult.value;
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const inventory = projectUserInventory(
			inventoryResult.value,
			createUserOwnedMasterSupport(database),
		);
		const isSiscaShopNewArrivalRead = markSiscaShopNewArrivalRead(
			state,
			user.playerId,
		);
		persistRouteStateIfChanged(
			routeContext,
			storeResult.created ||
				inventoryResult.created ||
				isSiscaShopNewArrivalRead,
		);
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json(
			createSiscaStoreListResponse(database, store, master, inventory),
		);
	});

	typedEndpoint<SiscaStorePurchaseRequest, SiscaStorePurchaseResponse>({
		requiresSession: true,
	});
	app.post('/v1/sisca_store/set_purchase', async (c) => {
		const body = await readJson(c.req.raw);
		const siscaStoreDatasId = getNumberField(body, 'sisca_store_datas_id');
		const purchaseNum = getNumberField(body, 'purchase_num') ?? 1;
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		if (siscaStoreDatasId === undefined) {
			return routeContext.respondError(c, 'siscaStoreItemIdRequired');
		}
		const playerId = user.playerId;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const master = getSiscaStoreMasterFromDatabase(database);
		const store = ensureUserSiscaStore(state, playerId, master).value;
		const purchaseResult = purchaseSiscaStoreItemForUser({
			database,
			sourceMasterReleaseId: masterRelease.masterReleaseId,
			state,
			user,
			store,
			master,
			userItemsGetList,
			siscaStoreDatasId,
			purchaseNum,
			userStatus: routeContext.resolveUserStatus(c, user),
		});
		if (purchaseResult.type === 'invalid') {
			return routeContext.respondError(c, 'siscaStoreInvalidPurchase');
		}
		if (purchaseResult.type === 'notAvailable') {
			return routeContext.respondError(c, 'siscaStoreItemNotAvailable');
		}
		if (purchaseResult.type === 'siscaInsufficient') {
			return routeContext.respondError(c, 'siscaStoreSiscaInsufficient');
		}
		if (purchaseResult.type === 'itemDefinitionNotFound') {
			return routeContext.respondError(
				c,
				'siscaPurchaseItemDefinitionNotFound',
			);
		}
		persistRouteState(routeContext);
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json(
			createSiscaStorePurchaseResponse(
				purchaseResult.siscaBalance.free,
				purchaseResult.siscaBalance.paid,
				purchaseResult.userItem,
			),
		);
	});

	return app;
}
