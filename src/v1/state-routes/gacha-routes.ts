import { Hono } from 'hono';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { createGachaHistoryRoutes } from './gacha/gacha-history-routes.ts';
import { createGachaListRoutes } from './gacha/gacha-list-routes.ts';
import { createGachaPurchaseRoutes } from './gacha/gacha-purchase-routes.ts';
import { createSelectTicketRoutes } from './gacha/select-ticket-routes.ts';
import { createGachaGuaranteeExchangeRoutes } from './gacha-guarantee-exchange-routes.ts';

export function createGachaRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	app.route('/', createGachaListRoutes(routeContext));
	app.route('/', createGachaHistoryRoutes(routeContext));
	app.route('/', createGachaPurchaseRoutes(routeContext));
	app.route('/', createGachaGuaranteeExchangeRoutes(routeContext));
	app.route('/', createSelectTicketRoutes(routeContext));
	return app;
}
