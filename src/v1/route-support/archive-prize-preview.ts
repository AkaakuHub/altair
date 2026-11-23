import type { Context } from 'hono';
import {
	findArchivePrizePresent,
	findFirstArchivePrizePresent,
} from '../../application/archive-prize-presents.ts';
import { createArchivePrizePreview } from '../../application/archive-prize-preview.ts';
import { getGiftLiveIdentityFingerprint } from '../../master-data/archive-identity.ts';
import { getArchivePrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { ensureUserPresentBox } from '../../state/user-presents-state.ts';
import { createArchivePrizeResponse } from '../responses/archive-award-response.ts';
import { withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function respondArchivePrizePreview(
	c: Context,
	routeContext: StateRouteContext,
	presentBoxId: string,
): Response | Promise<Response> {
	return withRequestUser(c, routeContext, (user) => {
		const database = routeContext.resolveMasterDatabase(c, user);
		const presentBox = ensureUserPresentBox(
			routeContext.state,
			user.playerId,
		).value;
		const present =
			presentBoxId.length > 0
				? findArchivePrizePresent(presentBox, presentBoxId)
				: findFirstArchivePrizePresent(presentBox);
		const preview = present
			? createArchivePrizePreview(
					routeContext.state,
					user.playerId,
					present,
					getArchivePrizeMasterFromDatabase(database, present.live_id),
					getGiftLiveIdentityFingerprint(database, 'withlive', present.live_id),
					routeContext.resolveUserStatus(c, user),
				)
			: undefined;
		if (!preview) {
			return routeContext.respondError(c, 'archiveGiftStateNotFound');
		}
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(createArchivePrizeResponse(preview));
	});
}
