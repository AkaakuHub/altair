import type { Context } from 'hono';
import { allocateWithstationPrizeStars } from '../../application/archive-prize-star-allocation.ts';
import { readPrizeStarAllocations } from '../../application/prize-star-allocations.ts';
import { getMemberFanLevelTableFromDatabase } from '../../master-data/member-fan-level-master.ts';
import { readJson } from '../http/read-json.ts';
import { getStringField } from './request-fields.ts';
import { persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';
import { readWithstationPrizeRequest } from './withstation-prize-request.ts';

export async function setWithstationPrizeStars(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	const body = await readJson(c.req.raw);
	const presentBoxId = getStringField(body, 'present_box_id');
	const setStarJson = getStringField(body, 'set_star_json');
	const allocations = readPrizeStarAllocations(setStarJson);
	if (presentBoxId.length === 0 || allocations === undefined)
		return routeContext.respondError(c, 'withstationPrizeNotFound');
	const request = readWithstationPrizeRequest(
		c,
		routeContext,
		'',
		presentBoxId,
	);
	if (request instanceof Response) return request;
	const { user, presentBox, master, provenance, database } = request;
	if (
		!allocateWithstationPrizeStars(
			routeContext.state,
			user.playerId,
			presentBox,
			presentBoxId,
			allocations,
			routeContext.resolveUserStatus(c, user),
			getMemberFanLevelTableFromDatabase(database),
			provenance.identityFingerprint,
			master.characterIds,
		)
	) {
		return routeContext.respondError(c, 'withstationPrizeNotFound');
	}
	persistRouteState(routeContext);
	routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
	return c.json({ result: true });
}
