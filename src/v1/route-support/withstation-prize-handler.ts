import type { Context } from 'hono';
import { ensureArchivePlaybackPrize } from '../../application/archive-prize-gift-points.ts';
import { findWithstationPrizePresent } from '../../application/archive-prize-presents.ts';
import { createArchivePrizePreview } from '../../application/archive-prize-preview.ts';
import { createWithstationPrizeResponse } from '../responses/withstation-session-response.ts';
import { persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';
import { readWithstationPrizeRequest } from './withstation-prize-request.ts';

export function getWithstationPrize(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const request = readWithstationPrizeRequest(
		c,
		routeContext,
		c.req.query('live_id') ?? '',
		c.req.query('present_box_id') ?? '',
	);
	if (request instanceof Response) return request;
	const { user, presentBox, master, provenance } = request;
	const isNewPrize = ensureArchivePlaybackPrize(
		routeContext.state,
		presentBox,
		user.playerId,
		master,
		provenance,
		provenance,
	);
	const present =
		request.present ??
		findWithstationPrizePresent(
			presentBox,
			master.liveId,
			provenance.identityFingerprint,
		);
	const preview = present
		? createArchivePrizePreview(
				routeContext.state,
				user.playerId,
				present,
				master,
				provenance.identityFingerprint,
				routeContext.resolveUserStatus(c, user),
			)
		: undefined;
	if (!preview) return routeContext.respondError(c, 'withstationPrizeNotFound');
	persistRouteStateIfChanged(routeContext, isNewPrize);
	routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
	return c.json(
		createWithstationPrizeResponse(
			preview,
			present?.withstationPlaybackReward !== undefined,
		),
	);
}
