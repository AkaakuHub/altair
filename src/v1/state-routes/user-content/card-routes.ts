import { Hono } from 'hono';
import {
	projectUserCards,
	projectUserInventory,
} from '../../../application/user-owned-master-projection.ts';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../../master-data/card-detail-template.ts';
import { createUserOwnedMasterSupport } from '../../../master-data/user-owned-master-support.ts';
import {
	ensureUserCards,
	findUserCard,
} from '../../../state/user-card-aggregate-state.ts';
import { ensureUserInventory } from '../../../state/user-inventory-aggregate.ts';
import { readJson } from '../../http/read-json.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type { UserCardDetailRequest } from '../../response-types/user-card-deck-request-types.ts';
import type {
	UserCardDetailResponse,
	UserCardsResponse,
} from '../../response-types/user-card-deck-response-types.ts';
import { createCardDetailResponse } from '../../responses/card-detail-response.ts';
import { createCardMemberFanLevelsForResponse } from '../../responses/card-member-fan-levels.ts';
import {
	createUserCardDetailResponseWithMemberFanLevels,
	createUserCardsResponseWithMemberFanLevels,
} from '../../responses/user-card-response.ts';
import { createCardGrowthMasterSource } from '../../route-support/card-growth-master-source.ts';
import { persistCardRouteStateIfChanged } from '../../route-support/card-route-state.ts';
import {
	applyTrainingFlagsToCardListResponse,
	applyTrainingFlagsToCardResponse,
} from '../../route-support/card-training-flags.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import {
	getNumberField,
	getStringField,
} from '../../route-support/request-fields.ts';
import { getRequestUser } from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
import { createCardGrowthRoutes } from './card-growth-routes.ts';

export function createCardRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, state, userCardGetList, userItemsGetList } =
		routeContext;

	app.route('/', createCardGrowthRoutes(routeContext));

	typedEndpoint<UserCardDetailRequest, UserCardDetailResponse>({
		requiresSession: true,
	});
	app.post('/v1/user/card/get_detail', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const database = routeContext.resolveMasterDatabase(c, user);
		const body = await readJson(c.req.raw);
		const dCardDatasId = getStringField(body, 'd_card_datas_id');
		const cardsResult = ensureUserCards(state, user.playerId, userCardGetList);
		const masterSupport = createUserOwnedMasterSupport(database);
		const cards = projectUserCards(cardsResult.value, masterSupport);
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const inventory = projectUserInventory(
			inventoryResult.value,
			masterSupport,
		);
		const card = findUserCard(cards, dCardDatasId);
		const cardDatasId =
			card === undefined ? undefined : getNumberField(card, 'card_datas_id');
		if (cardDatasId === undefined) {
			return routeContext.respondError(c, 'userCardNotFound');
		}
		const userStatus = routeContext.resolveUserStatus(c, user);
		const userStatusResult = userStatus.ensure(state, user.playerId);
		const status = userStatusResult.value;
		const detail = createCardDetailResponse(
			getCardDetailTemplateByCardDatasIdFromDatabase(database, cardDatasId),
		);
		const response = createUserCardDetailResponseWithMemberFanLevels(
			cards,
			dCardDatasId,
			detail,
			createCardMemberFanLevelsForResponse(userStatus, status),
		);
		if (!response) {
			return routeContext.respondError(c, 'userCardNotFound');
		}
		if (
			!applyTrainingFlagsToCardResponse(
				createCardGrowthMasterSource(database),
				response,
				inventory,
			)
		) {
			return routeContext.respondError(c, 'userCardGrowthNotFound');
		}
		routeContext.applyResponseHeaders(c, defaultHeaders);
		persistCardRouteStateIfChanged(
			routeContext,
			userStatusResult.created,
			cardsResult.created,
			inventoryResult.created,
		);
		return c.json(response);
	});

	typedEndpoint<EmptyRequest, UserCardsResponse>({ requiresSession: true });
	app.post('/v1/user/card/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const database = routeContext.resolveMasterDatabase(c, user);
		const cardsResult = ensureUserCards(state, user.playerId, userCardGetList);
		const masterSupport = createUserOwnedMasterSupport(database);
		const cards = projectUserCards(cardsResult.value, masterSupport);
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const inventory = projectUserInventory(
			inventoryResult.value,
			masterSupport,
		);
		const userStatus = routeContext.resolveUserStatus(c, user);
		const userStatusResult = userStatus.ensure(state, user.playerId);
		const status = userStatusResult.value;
		const response = createUserCardsResponseWithMemberFanLevels(
			cards,
			createCardMemberFanLevelsForResponse(userStatus, status),
		);
		if (
			!applyTrainingFlagsToCardListResponse(
				createCardGrowthMasterSource(database),
				response,
				inventory,
			)
		) {
			return routeContext.respondError(c, 'userCardGrowthNotFound');
		}
		persistCardRouteStateIfChanged(
			routeContext,
			userStatusResult.created,
			cardsResult.created,
			inventoryResult.created,
		);
		return c.json(response);
	});

	return app;
}
