import { Hono } from 'hono';
import { projectUserInventory } from '../../application/user-owned-master-projection.ts';
import { getCollectionStickerInfoListFromDatabase } from '../../master-data/collection-sticker-info.ts';
import { getStickerExchangePurchaseMasterFromDatabase } from '../../master-data/shop-exchange-purchase-master.ts';
import {
	getStickerIdentityFingerprint,
	getStickerProvenance,
} from '../../master-data/sticker-identity.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureUserArchiveCollectionState } from '../../state/archive-collection-aggregate.ts';
import { createUtcTimestamp } from '../../state/registered-user-state.ts';
import {
	ensureUserInventory,
	findUserItemByItemId,
} from '../../state/user-inventory-aggregate.ts';
import { consumeUserItem } from '../../state/user-item-mutation.ts';
import {
	addUserSticker,
	getOwnedStickerIds,
} from '../../state/user-sticker-ownership.ts';
import { getShopExchangeMasterFromDatabase } from '../active-master-database/shop-exchange-responses.ts';
import { readJson } from '../http/read-json.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { StickerExchangePurchaseRequest } from '../response-types/shop-inventory-request-types.ts';
import type {
	StickerExchangeListResponse,
	StickerExchangePurchaseResponse,
} from '../response-types/shop-inventory-response-types.ts';
import { createStickerExchangeListResponse } from '../responses/shop-exchange-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { createMasterReleaseItemProvenance } from '../route-support/item-consumption.ts';
import { getNumberField } from '../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

const STICKER_EXCHANGE_POINT_ITEM_ID = 3009001;

export function createStickerExchangeRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { state, userItemsGetList } = routeContext;

	typedEndpoint<EmptyRequest, StickerExchangeListResponse>({
		requiresSession: true,
	});
	app.post('/v1/sticker_exchange/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const collectionResult = ensureUserArchiveCollectionState(
			state,
			user.playerId,
		);
		const collection = collectionResult.value;
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const inventory = projectUserInventory(
			inventoryResult.value,
			createUserOwnedMasterSupport(database),
		);
		const shopExchangeMaster = getShopExchangeMasterFromDatabase(database);
		persistRouteStateIfChanged(
			routeContext,
			collectionResult.created || inventoryResult.created,
		);
		return c.json(
			createStickerExchangeListResponse(
				shopExchangeMaster.stickerExchangeList,
				getOwnedStickerIds(collection, (stickerId) =>
					getStickerIdentityFingerprint(database, stickerId),
				),
				findUserItemByItemId(inventory, STICKER_EXCHANGE_POINT_ITEM_ID)
					?.itemNum ?? 0,
			),
		);
	});

	typedEndpoint<
		StickerExchangePurchaseRequest,
		StickerExchangePurchaseResponse
	>({ requiresSession: true });
	app.post('/v1/sticker_exchange/set_purchase', async (c) => {
		const body = await readJson(c.req.raw);
		const stickerExchangesId = getNumberField(body, 'sticker_exchanges_id');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		if (stickerExchangesId === undefined) {
			return routeContext.respondError(c, 'stickerExchangeInvalid');
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const master = getStickerExchangePurchaseMasterFromDatabase(
			database,
			stickerExchangesId,
		);
		if (!master) {
			return routeContext.respondError(c, 'stickerExchangeNotFound');
		}
		if (master.productStickerNum <= 0) {
			return routeContext.respondError(c, 'stickerExchangeInvalid');
		}
		const stickerCatalog = getCollectionStickerInfoListFromDatabase(database);
		const collection = ensureUserArchiveCollectionState(
			state,
			user.playerId,
		).value;
		const stickerProvenance = getStickerProvenance(
			database,
			masterRelease.masterReleaseId,
			master.productStickerId,
		);
		if (stickerProvenance === undefined) {
			return routeContext.respondError(c, 'stickerExchangeNotFound');
		}
		if (
			!stickerCatalog.some(
				(sticker) => sticker.stickers_id === master.productStickerId,
			)
		) {
			return routeContext.respondError(c, 'stickerExchangeNotFound');
		}
		if (
			getOwnedStickerIds(collection, (stickerId) =>
				getStickerIdentityFingerprint(database, stickerId),
			).includes(master.productStickerId)
		) {
			return routeContext.respondError(c, 'stickerExchangeNotFound');
		}
		const { value: inventory } = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const pointProvenance = createMasterReleaseItemProvenance(
			database,
			masterRelease.masterReleaseId,
			STICKER_EXCHANGE_POINT_ITEM_ID,
		);
		if (
			pointProvenance === undefined ||
			!consumeUserItem(
				inventory,
				'',
				STICKER_EXCHANGE_POINT_ITEM_ID,
				master.materialItemNum,
				pointProvenance,
			)
		) {
			return routeContext.respondError(c, 'stickerPointInsufficient');
		}
		if (
			!addUserSticker(
				collection,
				stickerCatalog,
				master.productStickerId,
				createUtcTimestamp(),
				stickerProvenance,
			)
		) {
			return routeContext.respondError(c, 'stickerExchangeNotFound');
		}
		persistRouteState(routeContext);
		return c.json({
			sticker_point_num:
				findUserItemByItemId(inventory, STICKER_EXCHANGE_POINT_ITEM_ID)
					?.itemNum ?? 0,
		} satisfies StickerExchangePurchaseResponse);
	});

	return app;
}
