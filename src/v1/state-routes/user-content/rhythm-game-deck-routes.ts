import { Hono } from 'hono';
import { projectUserCards } from '../../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../../master-data/user-owned-master-support.ts';
import { ensureUserCards } from '../../../state/user-card-aggregate-state.ts';
import {
	modifyRhythmGameDeckList,
	setRhythmGameDeckName,
} from '../../active-master-database/rhythm-game-deck-responses.ts';
import { readJson } from '../../http/read-json.ts';
import type { NullResponse } from '../../response-types/common-response-types.ts';
import type {
	RhythmGameDeckModifyRequest,
	RhythmGameDeckSetDeckNameRequest,
} from '../../response-types/rhythm-game-deck-response-types.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../../route-support/endpoint-source.ts';
import { ensureRouteUserLiveState } from '../../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteState,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
export function createRhythmGameDeckRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored } = routeContext;
	typedEndpoint<RhythmGameDeckModifyRequest, NullResponse>({
		requiresSession: true,
	});
	app.post('/v1/rhythm_game_deck/modify_deck_list', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLive = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		).value;
		const response = modifyRhythmGameDeckList(
			await readJson(c.req.raw),
			userLive,
			new Set(
				projectUserCards(
					ensureUserCards(
						routeContext.state,
						user.playerId,
						routeContext.userCardGetList,
					).value,
					createUserOwnedMasterSupport(
						routeContext.resolveMasterDatabase(c, user),
					),
				).userCardDataList.map((card) => card.d_card_datas_id),
			),
		);
		if (!response) {
			return routeContext.respondError(c, 'rhythmGameDeckRequired');
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	apkDumpTypedEndpoint<RhythmGameDeckSetDeckNameRequest, NullResponse>({
		requiresSession: true,
	});
	app.post('/v1/rhythm_game_deck/set_deck_name', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const response = setRhythmGameDeckName(
			await readJson(c.req.raw),
			ensureRouteUserLiveState(routeContext, user.playerId).value,
		);
		if (!response) {
			return routeContext.respondError(c, 'rhythmGameDeckRequired');
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});

	return app;
}
