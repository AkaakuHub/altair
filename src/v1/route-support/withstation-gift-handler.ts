import { randomUUID } from 'node:crypto';
import type { Context } from 'hono';
import { addWithstationGiftPointAndPrizePresents } from '../../application/archive-prize-gift-points.ts';
import { getGiftLiveProvenance } from '../../master-data/archive-identity.ts';
import { getWithStationPrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { ensureUserProfileDesign } from '../../state/profile-design-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { ensureUserPresentBox } from '../../state/user-presents-state.ts';
import { readJson } from '../http/read-json.ts';
import { consumeGiftShopItem } from './archive-gift-shop.ts';
import { getNumberField, getStringField } from './request-fields.ts';
import { persistRouteState, withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';
import { createWithstationGiftResponse } from './withstation-gift-response.ts';

export async function sendWithstationGift(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	return withRequestUser(c, routeContext, async (user) => {
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const body = await readJson(c.req.raw);
		const liveId = getStringField(body, 'live_id');
		const userItemId = getStringField(body, 'user_item_id');
		const useOwnAmount = getNumberField(body, 'use_own_amount') ?? 0;
		const archivePrizeMaster = getWithStationPrizeMasterFromDatabase(
			database,
			liveId,
		);
		if (liveId.length === 0 || archivePrizeMaster === undefined) {
			return routeContext.respondError(c, 'withstationGiftItemNotFound');
		}
		const liveProvenance = getGiftLiveProvenance(
			database,
			masterRelease.masterReleaseId,
			'withstation',
			liveId,
		);
		if (liveProvenance === undefined) {
			return routeContext.respondError(c, 'withstationGiftItemNotFound');
		}
		const playerId = user.playerId;
		const { value: inventory } = ensureUserInventory(
			routeContext.state,
			playerId,
			routeContext.userItemsGetList,
		);
		const userGiftPoint = consumeGiftShopItem(
			database,
			masterRelease.masterReleaseId,
			liveId,
			'withstation',
			inventory,
			userItemId,
			useOwnAmount,
		);
		if (userGiftPoint === undefined) {
			return routeContext.respondError(c, 'withstationGiftItemNotFound');
		}
		const presentBox = ensureUserPresentBox(routeContext.state, playerId).value;
		ensureUserProfileDesign(routeContext.state, playerId);
		const result = addWithstationGiftPointAndPrizePresents(
			routeContext.state,
			presentBox,
			playerId,
			liveId,
			userGiftPoint,
			archivePrizeMaster,
			liveProvenance,
			liveProvenance,
		);
		persistRouteState(routeContext);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(
			createWithstationGiftResponse(
				routeContext.state,
				playerId,
				randomUUID(),
				userGiftPoint,
				result.totalUserGiftPoint,
			),
		);
	});
}
