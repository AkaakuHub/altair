import type { Context } from 'hono';
import {
	projectUserCards,
	projectUserInventory,
} from '../../application/user-owned-master-projection.ts';
import { getGachaExchangeCardsBySelectTicketSeriesIdsFromDatabase } from '../../master-data/gacha-exchange-card-master.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureUserGachaState } from '../../state/gacha-aggregate-state.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { readJson } from '../http/read-json.ts';
import {
	createGachaExchangeCardHavingListResponse,
	createSelectTicketExchangeListResponse,
} from '../responses/gacha-response.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from './route-state.ts';
import {
	getSelectTicketExchangeListFromInventory,
	hasSelectTicketExchangeItem,
} from './select-ticket-exchange-route-state.ts';
import { getSelectTicketMasterReleaseSession } from './select-ticket-master-release-session.ts';
import { readSelectTicketHavingRequest } from './select-ticket-request.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createSelectTicketListHandler(routeContext: StateRouteContext) {
	return (c: Context) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const userGacha = ensureUserGachaState(
			routeContext.state,
			user.playerId,
		).value;
		userGacha.selectTicketExchangeMasterReleaseId =
			masterRelease.masterReleaseId;
		const inventory = ensureUserInventory(
			routeContext.state,
			user.playerId,
			routeContext.userItemsGetList,
		).value;
		persistRouteState(routeContext);
		return c.json(
			createSelectTicketExchangeListResponse(
				getSelectTicketExchangeListFromInventory(
					masterRelease.database,
					inventory,
				),
			),
		);
	};
}

export function createSelectTicketHavingListHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const { exchangeType, exchangeId } = readSelectTicketHavingRequest(
			await readJson(c.req.raw),
		);
		const session = getSelectTicketMasterReleaseSession(c, routeContext);
		if (session instanceof Response) return session;
		if (exchangeType !== 2 || exchangeId === undefined) {
			return routeContext.respondError(c, 'gachaExchangeCardNotFound');
		}
		const inventoryResult = ensureUserInventory(
			routeContext.state,
			session.user.playerId,
			routeContext.userItemsGetList,
		);
		const masterSupport = createUserOwnedMasterSupport(session.database);
		const inventory = projectUserInventory(
			inventoryResult.value,
			masterSupport,
		);
		const exchangeCardList = hasSelectTicketExchangeItem(
			session.database,
			inventory,
			exchangeId,
		)
			? getGachaExchangeCardsBySelectTicketSeriesIdsFromDatabase(
					session.database,
					[exchangeId],
				)
			: [];
		const cardsResult = ensureUserCards(
			routeContext.state,
			session.user.playerId,
			routeContext.userCardGetList,
		);
		const cards = projectUserCards(cardsResult.value, masterSupport);
		persistRouteStateIfChanged(
			routeContext,
			inventoryResult.created || cardsResult.created,
		);
		return c.json(
			createGachaExchangeCardHavingListResponse(
				exchangeCardList,
				cards.userCardDataList,
			),
		);
	};
}
