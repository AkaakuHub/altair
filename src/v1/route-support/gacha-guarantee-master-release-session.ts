import type { Context } from 'hono';
import { ensureUserGachaState } from '../../state/gacha-aggregate-state.ts';
import { resolveMasterReleaseBoundSessionDatabase } from './master-release-bound-session.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getGachaGuaranteeMasterReleaseSession(
	c: Context,
	routeContext: StateRouteContext,
) {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const userGacha = ensureUserGachaState(
		routeContext.state,
		user.playerId,
	).value;
	const sourceMasterReleaseId = userGacha.guaranteeExchangeMasterReleaseId;
	const database = resolveMasterReleaseBoundSessionDatabase(c, routeContext, {
		masterReleaseId: sourceMasterReleaseId,
	});
	if (database instanceof Response) return database;
	if (sourceMasterReleaseId === undefined)
		return routeContext.respondError(c, 'sessionMasterReleaseUnavailable');
	return { user, userGacha, sourceMasterReleaseId, database };
}
