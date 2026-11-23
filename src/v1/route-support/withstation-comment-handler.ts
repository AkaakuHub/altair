import { randomUUID } from 'node:crypto';
import type { Context } from 'hono';
import { getWithStationPrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { liveBroadcastCommentStyle } from '../../state/live-broadcast-comment-style.ts';
import { readJson } from '../http/read-json.ts';
import type { WithstationCommentResponse } from '../response-types/withstation-response-types.ts';
import { isJsonRecord } from './request-fields.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function sendWithstationComment(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const body = await readJson(c.req.raw);
	if (
		!isJsonRecord(body) ||
		typeof body.live_id !== 'string' ||
		typeof body.comment !== 'string' ||
		body.comment.length === 0
	)
		return routeContext.respondError(c, 'liveBroadcastMutationInvalid');
	const playTimeMs = body.play_time_ms === undefined ? 0 : body.play_time_ms;
	if (
		typeof playTimeMs !== 'number' ||
		!Number.isSafeInteger(playTimeMs) ||
		playTimeMs < 0
	)
		return routeContext.respondError(c, 'liveBroadcastMutationInvalid');
	const { database } = routeContext.resolveRequestMasterRelease(c, user);
	if (!getWithStationPrizeMasterFromDatabase(database, body.live_id))
		return routeContext.respondError(c, 'liveBroadcastNotFound');
	const response: WithstationCommentResponse = {
		...liveBroadcastCommentStyle,
		timeline_id: randomUUID(),
		comment: body.comment,
		timeline_time_ms: playTimeMs,
	};
	return c.json(response);
}
