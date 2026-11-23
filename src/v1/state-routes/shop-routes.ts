import { Hono } from 'hono';
import { markShopNewArrivalRead } from '../../state/user-header-state.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	ItemStoreGetListResponse,
	JewelShopGetMembershipListResponse,
	ShopListResponse,
} from '../response-types/shop-inventory-response-types.ts';
import {
	createItemStoreGetListResponse,
	createJewelShopGetMembershipListResponse,
} from '../responses/item-store-response.ts';
import { createShopListResponse } from '../responses/shop-exchange-response.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import {
	getRequestUser,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import { ensureActiveShopExchangeState } from '../route-support/shop-exchange-route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { createGpPrizeExchangeRoutes } from './gp-prize-exchange-routes.ts';
import { createItemExchangeRoutes } from './item-exchange-routes.ts';
import { createPetalExchangeRoutes } from './petal-exchange-routes.ts';
import { createSiscaStoreRoutes } from './sisca-store-routes.ts';
import { createStickerExchangeRoutes } from './sticker-exchange-routes.ts';

export function createShopRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, state } = routeContext;

	typedEndpoint<EmptyRequest, ShopListResponse>({ requiresSession: true });
	app.post('/v1/shop/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const database = routeContext.resolveMasterDatabase(c, user);
		const exchangeResult = ensureActiveShopExchangeState(
			routeContext,
			user.playerId,
			database,
		);
		const exchange = exchangeResult.value;
		const isShopNewArrivalRead = markShopNewArrivalRead(state, user.playerId);
		persistRouteStateIfChanged(
			routeContext,
			exchangeResult.created || isShopNewArrivalRead,
		);
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json(createShopListResponse(exchange, exchangeResult.master));
	});

	apkDumpTypedEndpoint<EmptyRequest, ItemStoreGetListResponse>({
		requiresSession: true,
	});
	app.post('/v1/item_store/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		return c.json(createItemStoreGetListResponse());
	});

	apkDumpTypedEndpoint<EmptyRequest, JewelShopGetMembershipListResponse>({
		requiresSession: true,
	});
	app.post('/v1/jewel_shop/get_membership_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		return c.json(createJewelShopGetMembershipListResponse());
	});

	app.route('/', createPetalExchangeRoutes(routeContext));

	app.route('/', createGpPrizeExchangeRoutes(routeContext));

	app.route('/', createItemExchangeRoutes(routeContext));

	app.route('/', createStickerExchangeRoutes(routeContext));

	app.route('/', createSiscaStoreRoutes(routeContext));

	return app;
}
