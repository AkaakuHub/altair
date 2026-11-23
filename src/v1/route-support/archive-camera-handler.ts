import type { Context } from 'hono';
import { createArchiveCameraSelectionResponse } from '../../application/archive-camera/selection.ts';
import { getArchiveDetailFromDatabase } from '../active-master-database/archive-detail-response-service.ts';
import { readJson } from '../http/read-json.ts';
import {
	getNumberField,
	getStringField,
	isJsonRecord,
} from './request-fields.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createArchiveCameraHandler(routeContext: StateRouteContext) {
	return async (c: Context) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const body = await readJson(c.req.raw);
		const liveId = getStringField(body, 'live_id');
		const database = routeContext.resolveMasterDatabase(c, user);
		const detail = getArchiveDetailFromDatabase(database, liveId, false);
		const archive = detail?.response.body;
		if (
			!isJsonRecord(archive) ||
			!Array.isArray(archive.selectable_camera_types) ||
			!archive.selectable_camera_types.every(
				(value): value is number => typeof value === 'number',
			) ||
			!Array.isArray(archive.characters)
		) {
			return routeContext.respondError(c, 'endpointNotImplemented');
		}
		const response = createArchiveCameraSelectionResponse(body, {
			liveId,
			cameraTypes: archive.selectable_camera_types,
			characterIds: archive.characters.flatMap((character) => {
				const id = getNumberField(character, 'character_id');
				return id === undefined ? [] : [id];
			}),
		});
		return response === undefined
			? routeContext.respondError(c, 'liveBroadcastMutationInvalid')
			: c.json(response);
	};
}
