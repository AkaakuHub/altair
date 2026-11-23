import { Hono } from 'hono';
import {
	projectUserDeck,
	projectUserDecks,
} from '../../../application/user-deck-projection.ts';
import {
	getProjectedUserCardDataIds,
	projectUserCards,
} from '../../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../../master-data/user-owned-master-support.ts';
import { ensureUserCards } from '../../../state/user-card-aggregate-state.ts';
import { ensureUserDecks } from '../../../state/user-deck-aggregate.ts';
import { getDefaultDecks } from '../../../state/user-deck-defaults.ts';
import { modifyUserDeckList } from '../../../state/user-deck-mutation.ts';
import { readJson } from '../../http/read-json.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type { UserDeckModifyRequest } from '../../response-types/user-card-deck-request-types.ts';
import type {
	DeckListResponse,
	ModifiedDeckListResponse,
} from '../../response-types/user-card-deck-response-types.ts';
import { createCardMemberFanLevelsForResponse } from '../../responses/card-member-fan-levels.ts';
import {
	createDeckListResponse,
	createModifiedDeckListResponse,
} from '../../responses/deck-response.ts';
import { createUserCardDataListWithMemberFanLevels } from '../../responses/user-card-response.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
export function createUserDeckRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { state, userCardGetList } = routeContext;
	typedEndpoint<EmptyRequest, DeckListResponse>({ requiresSession: true });
	app.post('/v1/user/deck/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userDeckResult = ensureUserDecks(
			state,
			user.playerId,
			getDefaultDecks(),
		);
		const userDeck = userDeckResult.value;
		const cardsResult = ensureUserCards(state, user.playerId, userCardGetList);
		const support = createUserOwnedMasterSupport(
			routeContext.resolveMasterDatabase(c, user),
		);
		const cards = projectUserCards(cardsResult.value, support);
		const visibleCardDataIds = getProjectedUserCardDataIds(cards);
		const userStatus = routeContext.resolveUserStatus(c, user);
		const statusResult = userStatus.ensure(state, user.playerId);
		const status = statusResult.value;
		const userCardDataList = createUserCardDataListWithMemberFanLevels(
			cards,
			createCardMemberFanLevelsForResponse(userStatus, status),
		);
		persistRouteStateIfChanged(
			routeContext,
			userDeckResult.created || cardsResult.created || statusResult.created,
		);
		return c.json(
			createDeckListResponse(
				projectUserDecks(userDeck, visibleCardDataIds),
				userCardDataList,
			),
		);
	});
	typedEndpoint<UserDeckModifyRequest, ModifiedDeckListResponse>({
		requiresSession: true,
	});
	app.post('/v1/user/deck/modify_deck_list', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userDeck = ensureUserDecks(
			state,
			user.playerId,
			getDefaultDecks(),
		).value;
		const cards = projectUserCards(
			ensureUserCards(state, user.playerId, userCardGetList).value,
			createUserOwnedMasterSupport(routeContext.resolveMasterDatabase(c, user)),
		);
		const visibleCardDataIds = getProjectedUserCardDataIds(cards);
		const modifiedDecks = modifyUserDeckList(
			userDeck,
			await readJson(c.req.raw),
			visibleCardDataIds,
		);
		if (!modifiedDecks) {
			return routeContext.respondError(c, 'deckModifyRequired');
		}
		persistRouteState(routeContext);
		return c.json(
			createModifiedDeckListResponse(
				modifiedDecks.map((deck) => projectUserDeck(deck, visibleCardDataIds)),
			),
		);
	});

	return app;
}
