import type { Context } from 'hono';
import { getWithStationPrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { readCurrentWithstationArchiveMillisecond } from '../../state/archive-playback-cursor.ts';
import { createWithstationInfoResponse } from '../responses/withstation-session-response.ts';
import { getRequestUserArchiveCollectionState } from './request-user-state.ts';
import { getRequestUser, persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getWithstationInfo(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const getComments = routeContext.getCommentsRepository;
	const cursor = readWithstationInfoCursor(c, routeContext);
	if (cursor instanceof Response) return cursor;
	const secondStart = cursor
		? Math.floor(cursor.playTimeMillisecond / 1000) * 1000
		: 0;
	return c.json(
		createWithstationInfoResponse(
			cursor
				? getComments().findBetweenMilliseconds(
						cursor.liveId,
						secondStart - 1,
						secondStart + 999,
						100,
					)
				: [],
		),
	);
}

function readWithstationInfoCursor(
	c: Context,
	routeContext: StateRouteContext,
) {
	const liveId = c.req.query('live_id');
	const playTime = c.req.query('play_time_ms');
	if (liveId !== undefined || playTime !== undefined) {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const playTimeMillisecond = Number(playTime);
		if (
			!liveId ||
			!playTime?.trim() ||
			!Number.isSafeInteger(playTimeMillisecond) ||
			playTimeMillisecond < 0
		) {
			return c.json({ error: 'live_idとplay_time_msが不正です。' }, 400);
		}
		const { database } = routeContext.resolveRequestMasterRelease(c, user);
		return getWithStationPrizeMasterFromDatabase(database, liveId)
			? { liveId, playTimeMillisecond }
			: undefined;
	}
	const session = getRequestUserArchiveCollectionState(c, routeContext);
	if (session instanceof Response) return session;
	persistRouteStateIfChanged(routeContext, session.created);
	return readCurrentWithstationArchiveMillisecond(
		session.collection,
		routeContext.date.currentDate(),
	);
}
