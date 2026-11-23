import { Hono } from 'hono';
import { projectUserInventory } from '../../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../../master-data/user-owned-master-support.ts';
import {
	ensureUserInventory,
	findUserItemByUserItemId,
} from '../../../state/user-inventory-aggregate.ts';
import { getItemDetailByItemIdFromDatabase } from '../../active-master-database/item-detail-response-query.ts';
import { readJson } from '../../http/read-json.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type { UserItemDetailRequest } from '../../response-types/shop-inventory-request-types.ts';
import type {
	UserItemDetailResponse,
	UserItemsResponse,
} from '../../response-types/shop-inventory-response-types.ts';
import {
	createUserItemDetailResponse,
	createUserItemsResponse,
} from '../../responses/user-items-response.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { getStringField } from '../../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteStateIfChanged,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createItemRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { state, userItemsGetList } = routeContext;

	typedEndpoint<UserItemDetailRequest, UserItemDetailResponse>({
		requiresSession: true,
	});
	app.post('/v1/user/item/get_detail', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const body = await readJson(c.req.raw);
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const database = routeContext.resolveMasterDatabase(c, user);
		const inventory = projectUserInventory(
			inventoryResult.value,
			createUserOwnedMasterSupport(database),
		);
		const item = findUserItemByUserItemId(
			inventory,
			getStringField(body, 'd_item_datas_id'),
		);
		if (!item) {
			return routeContext.respondError(c, 'userItemNotFound');
		}
		const detail = getItemDetailByItemIdFromDatabase(database, item.itemId);
		if (!detail) {
			return routeContext.respondError(c, 'userItemNotFound');
		}
		const response = createUserItemDetailResponse(item, detail.response.body);
		persistRouteStateIfChanged(routeContext, inventoryResult.created);
		return c.json(response);
	});

	typedEndpoint<EmptyRequest, UserItemsResponse>({ requiresSession: true });
	app.post('/v1/user/items/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const inventory = projectUserInventory(
			inventoryResult.value,
			createUserOwnedMasterSupport(routeContext.resolveMasterDatabase(c, user)),
		);
		persistRouteStateIfChanged(routeContext, inventoryResult.created);
		return c.json(createUserItemsResponse(inventory));
	});

	return app;
}
