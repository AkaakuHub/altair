import { Hono } from 'hono';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	ItemExchangeListRequest,
	ItemExchangePurchaseRequest,
} from '../response-types/shop-inventory-request-types.ts';
import type {
	ItemExchangeListResponse,
	ItemExchangePurchaseResponse,
	LimitBreakMaterialConvertListResponse,
} from '../response-types/shop-inventory-response-types.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import {
	convertLimitBreakMaterials,
	getLimitBreakMaterialConvertList,
} from '../route-support/item-exchange-convert-handlers.ts';
import { getItemExchangeList } from '../route-support/item-exchange-list-handler.ts';
import { purchaseItemExchange } from '../route-support/item-exchange-purchase-handler.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export type ItemExchangeSetLimitBreakMaterialConvertResponse = {
	get_item_list: Array<{ item_id: number; get_num: number }>;
};

export function createItemExchangeRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	typedEndpoint<ItemExchangeListRequest, ItemExchangeListResponse>({
		requiresSession: true,
	});
	app.post('/v1/item_exchange/get_list_new', (c) =>
		getItemExchangeList(c, routeContext),
	);
	typedEndpoint<ItemExchangePurchaseRequest, ItemExchangePurchaseResponse>({
		requiresSession: true,
	});
	app.post('/v1/item_exchange/set_purchase', (c) =>
		purchaseItemExchange(c, routeContext),
	);
	typedEndpoint<EmptyRequest, LimitBreakMaterialConvertListResponse>({
		requiresSession: true,
	});
	app.post('/v1/item_exchange/get_limit_break_material_convert_list', (c) =>
		getLimitBreakMaterialConvertList(c, routeContext),
	);
	apkDumpTypedEndpoint<
		EmptyRequest,
		ItemExchangeSetLimitBreakMaterialConvertResponse
	>({ requiresSession: true });
	app.post('/v1/item_exchange/set_limit_break_material_convert', (c) =>
		convertLimitBreakMaterials(c, routeContext),
	);
	return app;
}
