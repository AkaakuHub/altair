import { randomUUID } from 'node:crypto';
import type { Context } from 'hono';
import { getWithStationPrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { getMessageCardMasterByItemId } from '../../master-data/message-card-master.ts';
import {
	ensureUserInventory,
	findUserItemByUserItemId,
} from '../../state/user-inventory-aggregate.ts';
import { consumeUserItem } from '../../state/user-item-mutation.ts';
import { readJson } from '../http/read-json.ts';
import { createWithstationMessageCardResponse } from '../responses/withstation-response.ts';
import { createMasterReleaseItemProvenance } from './item-consumption.ts';
import { getStringField } from './request-fields.ts';
import { persistRouteState, withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function sendWithstationMessageCard(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	return withRequestUser(c, routeContext, async (user) => {
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const body = await readJson(c.req.raw);
		const liveId = getStringField(body, 'live_id');
		if (getWithStationPrizeMasterFromDatabase(database, liveId) === undefined)
			return routeContext.respondError(c, 'withstationMessageCardNotFound');
		const userItemId = getStringField(body, 'user_item_id');
		const message = getStringField(body, 'message');
		const { value: inventory } = ensureUserInventory(
			routeContext.state,
			user.playerId,
			routeContext.userItemsGetList,
		);
		const userItem = findUserItemByUserItemId(inventory, userItemId);
		const messageCard =
			userItem === undefined
				? undefined
				: getMessageCardMasterByItemId(database, userItem.itemId);
		const provenance =
			userItem === undefined
				? undefined
				: createMasterReleaseItemProvenance(
						database,
						masterRelease.masterReleaseId,
						userItem.itemId,
					);
		if (
			userItem === undefined ||
			messageCard === undefined ||
			provenance === undefined ||
			!consumeUserItem(inventory, userItemId, userItem.itemId, 1, provenance)
		) {
			return routeContext.respondError(c, 'withstationMessageCardNotFound');
		}
		persistRouteState(routeContext);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(
			createWithstationMessageCardResponse({
				timelineId: randomUUID(),
				nameColor: messageCard.nameColor,
				textColor: messageCard.messageTextColor,
				backgroundColor: messageCard.backgroundColor,
				message,
				textSize: messageCard.messageTextSize,
				isTextBold: messageCard.isMessageTextBold,
			}),
		);
	});
}
