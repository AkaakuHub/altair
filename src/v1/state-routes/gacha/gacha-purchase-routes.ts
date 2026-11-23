import { Hono } from 'hono';
import type { GachaPurchaseResponse } from '../../response-types/gacha-response-types.ts';
import { apkDumpTypedEndpoint } from '../../route-support/endpoint-source.ts';
import { handleGachaPurchase } from '../../route-support/gacha-purchase-handler.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export type GachaSetPurchaseRequest = {
	gacha_series_id: number;
	gacha_set_purchase_type: number;
};

export function createGachaPurchaseRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	apkDumpTypedEndpoint<GachaSetPurchaseRequest, GachaPurchaseResponse>();
	app.post('/v1/gacha/set_purchase', (c) =>
		handleGachaPurchase(c, routeContext),
	);
	return app;
}
