import type { Context } from 'hono';
import { getGiftLiveIdentityFingerprint } from '../../master-data/archive-identity.ts';
import { getWithStationPrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { isSameEntityIdentity } from '../../state/entity-provenance.ts';
import { createUserGiftPointRankingsResponse } from '../responses/live-gift-point-rankings-response.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getWithstationGiftPointRankings(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const liveId = c.req.query('live_id') ?? '';
	const { database } = routeContext.resolveRequestMasterRelease(c, user);
	const master = getWithStationPrizeMasterFromDatabase(database, liveId);
	const fingerprint = getGiftLiveIdentityFingerprint(
		database,
		'withstation',
		liveId,
	);
	if (!master || !fingerprint)
		return routeContext.respondError(c, 'liveBroadcastNotFound');
	const points = routeContext.state.archiveGiftPoints
		.filter(
			(point) =>
				point.liveId === liveId &&
				point.totalUserGiftPoint > 0 &&
				isSameEntityIdentity(point.identityFingerprint, fingerprint),
		)
		.map((point) => ({
			playerId: point.playerId,
			totalGiftPoint: point.totalUserGiftPoint,
		}));
	return c.json(
		createUserGiftPointRankingsResponse(
			points,
			user.playerId,
			routeContext.state,
			points
				.reduce((total, point) => total + BigInt(point.totalGiftPoint), 0n)
				.toString(),
			1,
		),
	);
}
