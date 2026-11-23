import { Hono } from 'hono';
import type {
	GachaGuaranteePointExchangeRequest,
	GachaGuaranteePointListRequest,
} from '../response-types/gacha-exchange-request-types.ts';
import type {
	GachaGuaranteePointExchangeResponse,
	GachaGuaranteePointListResponse,
} from '../response-types/gacha-response-types.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { createGachaGuaranteeExchangeHandler } from '../route-support/gacha-guarantee-exchange-handler.ts';
import { createGachaGuaranteeListHandler } from '../route-support/gacha-guarantee-list-handler.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createGachaGuaranteeExchangeRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	typedEndpoint<
		GachaGuaranteePointListRequest,
		GachaGuaranteePointListResponse
	>({ requiresSession: true });
	app.post(
		'/v1/gacha/get_guarantee_point_list',
		createGachaGuaranteeListHandler(routeContext),
	);
	typedEndpoint<
		GachaGuaranteePointExchangeRequest,
		GachaGuaranteePointExchangeResponse
	>({ requiresSession: true });
	app.post(
		'/v1/gacha/set_guarantee_point_exchange',
		createGachaGuaranteeExchangeHandler(routeContext),
	);
	return app;
}
