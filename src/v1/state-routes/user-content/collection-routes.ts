import { Hono } from 'hono';
import { getCollectionStickerInfoListFromDatabase } from '../../../master-data/collection-sticker-info.ts';
import { createCollectionCharacterInfoResponse } from '../../active-master-database/collection-character-response-service.ts';
import {
	createCollectionMusicListResponse,
	createGallaryListResponse,
} from '../../active-master-database/collection-responses.ts';
import { readJson } from '../../http/read-json.ts';
import type {
	CollectionCharacterInfoRequest,
	CollectionCharacterInfoResponse,
	CollectionMusicListResponse,
	CollectionStickerListResponse,
	GallaryListResponse,
} from '../../response-types/collection-response-types.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import { createCollectionStickerListResponse } from '../../responses/archive-collection-response.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { getStringField } from '../../route-support/request-fields.ts';
import { ensureRouteUserArchiveCollectionState } from '../../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteStateIfChanged,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
export function createCollectionRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored } = routeContext;
	typedEndpoint<EmptyRequest, GallaryListResponse>({ requiresSession: true });
	app.post('/v1/collection/get_gallary_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		return c.json(
			createGallaryListResponse(routeContext.resolveMasterDatabase(c, user)),
		);
	});
	typedEndpoint<EmptyRequest, CollectionMusicListResponse>({
		requiresSession: true,
	});
	app.post('/v1/collection/get_music_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		return c.json(
			createCollectionMusicListResponse(
				routeContext.resolveMasterDatabase(c, user),
			),
		);
	});
	typedEndpoint<EmptyRequest, CollectionStickerListResponse>({
		requiresSession: true,
	});
	app.post('/v1/collection/get_sticker_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const database = routeContext.resolveMasterDatabase(c, user);
		const collectionResult = ensureRouteUserArchiveCollectionState(
			routeContext,
			user.playerId,
		);
		persistRouteStateIfChanged(routeContext, collectionResult.created);
		return c.json(
			createCollectionStickerListResponse(
				collectionResult.value,
				getCollectionStickerInfoListFromDatabase(database),
				database,
			),
		);
	});
	typedEndpoint<
		CollectionCharacterInfoRequest,
		CollectionCharacterInfoResponse
	>({ requiresSession: true });
	app.post('/v1/collection/get_character_info', async (c) => {
		const body = await readJson(c.req.raw);
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		return respondStored(
			c,
			defaultHeaders,
			createCollectionCharacterInfoResponse(
				routeContext.resolveMasterDatabase(c, user),
				Number.parseInt(getStringField(body, 'character_id'), 10),
			),
		);
	});

	return app;
}
