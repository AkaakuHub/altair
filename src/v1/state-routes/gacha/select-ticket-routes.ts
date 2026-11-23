import { Hono } from 'hono';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type {
	GachaExchangeCardHavingListRequest,
	SelectTicketExchangeRequest,
} from '../../response-types/gacha-exchange-request-types.ts';
import type {
	GachaExchangeCardHavingListResponse,
	SelectTicketExchangeListResponse,
	SelectTicketExchangeReceiptResponse,
} from '../../response-types/gacha-response-types.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { createSelectTicketExchangeHandler } from '../../route-support/select-ticket-exchange-handler.ts';
import {
	createSelectTicketHavingListHandler,
	createSelectTicketListHandler,
} from '../../route-support/select-ticket-list-handlers.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createSelectTicketRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	typedEndpoint<EmptyRequest, SelectTicketExchangeListResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/select_ticket_exchange/get_list',
		createSelectTicketListHandler(routeContext),
	);
	typedEndpoint<
		GachaExchangeCardHavingListRequest,
		GachaExchangeCardHavingListResponse
	>({ requiresSession: true });
	app.post(
		'/v1/gacha/get_exchange_card_having_list',
		createSelectTicketHavingListHandler(routeContext),
	);
	typedEndpoint<
		SelectTicketExchangeRequest,
		SelectTicketExchangeReceiptResponse
	>({ requiresSession: true });
	app.post(
		'/v1/gacha/set_select_ticket_exchange',
		createSelectTicketExchangeHandler(routeContext),
	);
	return app;
}
