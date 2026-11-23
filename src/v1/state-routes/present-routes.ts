import { Hono } from 'hono';
import { isPrizeStarPresent } from '../../application/archive-prize-presents.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import {
	ensureUserPresentBox,
	type PresentBoxItem,
	receiveAllPresentBoxItems,
	receivePresentBoxItem,
} from '../../state/user-presents-state.ts';
import { readJson } from '../http/read-json.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	PresentBoxListResponse,
	PresentBoxPageRequest,
	PresentBoxReceiptAllResponse,
	PresentBoxReceiptRequest,
	PresentBoxReceiptResponse,
} from '../response-types/present-box-response-types.ts';
import {
	createPresentBoxHistoryResponse,
	createPresentBoxListResponse,
	createPresentBoxReceiptAllResponse,
	createPresentBoxReceiptResponse,
} from '../responses/present-box-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import {
	applyPresentToState,
	getPresentBoxPageNumber,
	validatePresentReward,
} from '../route-support/present-route-state.ts';
import { getStringField } from '../route-support/request-fields.ts';
import {
	persistRouteState,
	persistRouteStateIfChanged,
	withRequestUser,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createPresentRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, state, userItemsGetList } = routeContext;
	const isRestricted = (present: PresentBoxItem) =>
		isPrizeStarPresent(present) ||
		routeContext.isPresentRestricted?.(present) === true;

	typedEndpoint<PresentBoxPageRequest, PresentBoxListResponse>();
	app.post('/v1/present_box/get_list', async (c) => {
		return withRequestUser(c, routeContext, async (user) => {
			const body = await readJson(c.req.raw);
			const page = getPresentBoxPageNumber(body);
			const presentBoxResult = ensureUserPresentBox(state, user.playerId);
			persistRouteStateIfChanged(routeContext, presentBoxResult.created);
			routeContext.applyResponseHeaders(c, defaultHeaders);
			return c.json(createPresentBoxListResponse(presentBoxResult.value, page));
		});
	});

	typedEndpoint<PresentBoxPageRequest, PresentBoxListResponse>();
	app.post('/v1/present_box/get_history', async (c) => {
		return withRequestUser(c, routeContext, async (user) => {
			const body = await readJson(c.req.raw);
			const page = getPresentBoxPageNumber(body);
			const presentBoxResult = ensureUserPresentBox(state, user.playerId);
			persistRouteStateIfChanged(routeContext, presentBoxResult.created);
			routeContext.applyResponseHeaders(c, defaultHeaders);
			return c.json(
				createPresentBoxHistoryResponse(presentBoxResult.value, page),
			);
		});
	});

	typedEndpoint<PresentBoxReceiptRequest, PresentBoxReceiptResponse>();
	app.post('/v1/present_box/set_item', async (c) => {
		return withRequestUser(c, routeContext, async (requestUser) => {
			const body = await readJson(c.req.raw);
			const presentBoxId = getStringField(body, 'd_present_boxes_id');
			const presentBox = ensureUserPresentBox(
				state,
				requestUser.playerId,
			).value;
			const presentItem = presentBox.presentList.find(
				(present) => present.d_present_boxes_id === presentBoxId,
			);
			if (presentItem === undefined || isRestricted(presentItem)) {
				return routeContext.respondError(c, 'presentBoxItemNotFound');
			}
			ensureUserInventory(state, requestUser.playerId, userItemsGetList);
			applyPresentToState(c, routeContext, requestUser, presentItem);
			const receivedItem = receivePresentBoxItem(presentBox, presentBoxId);
			if (!receivedItem) {
				throw new Error(`received present disappeared: ${presentBoxId}`);
			}
			persistRouteState(routeContext);
			routeContext.applyResponseHeaders(c, defaultHeaders);
			return c.json(createPresentBoxReceiptResponse(receivedItem));
		});
	});

	typedEndpoint<EmptyRequest, PresentBoxReceiptAllResponse>();
	app.post('/v1/present_box/set_item_all', (c) => {
		return withRequestUser(c, routeContext, (requestUser) => {
			const presentBox = ensureUserPresentBox(
				state,
				requestUser.playerId,
			).value;
			ensureUserInventory(state, requestUser.playerId, userItemsGetList);
			const receivablePresents = presentBox.presentList.filter(
				(present) => !isRestricted(present),
			);
			for (const present of receivablePresents) {
				validatePresentReward(routeContext, present);
			}
			for (const present of receivablePresents) {
				applyPresentToState(c, routeContext, requestUser, present);
			}
			const receivedItems = receiveAllPresentBoxItems(
				presentBox,
				(present) => !isRestricted(present),
			);
			persistRouteState(routeContext);
			routeContext.applyResponseHeaders(c, defaultHeaders);
			return c.json(createPresentBoxReceiptAllResponse(receivedItems));
		});
	});

	return app;
}
