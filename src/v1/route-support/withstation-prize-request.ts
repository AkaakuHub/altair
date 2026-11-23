import type { Context } from 'hono';
import { isWithstationPrizePresent } from '../../application/archive-prize-presents.ts';
import { getGiftLiveProvenance } from '../../master-data/archive-identity.ts';
import { getWithStationPrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { isSameEntityIdentity } from '../../state/entity-provenance.ts';
import { ensureUserPresentBox } from '../../state/user-presents-state.ts';
import { resolveMasterReleaseBoundSessionDatabase } from './master-release-bound-session.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function readWithstationPrizeRequest(
	c: Context,
	routeContext: StateRouteContext,
	liveId: string,
	presentBoxId: string,
) {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const existingPresentBox = routeContext.state.userPresentBoxes.find(
		(box) => box.playerId === user.playerId,
	);
	const present = presentBoxId.length
		? existingPresentBox?.presentList.find(
				(item) => item.d_present_boxes_id === presentBoxId,
			)
		: undefined;
	if (
		presentBoxId.length > 0 &&
		(!isWithstationPrizePresent(present) ||
			(liveId.length > 0 && present.live_id !== liveId))
	) {
		return routeContext.respondError(c, 'withstationPrizeNotFound');
	}
	const collection = routeContext.state.userArchiveCollections.find(
		(item) => item.playerId === user.playerId,
	);
	const targetLiveId =
		present?.live_id ??
		(liveId.length > 0
			? liveId
			: (collection?.currentWithstationArchiveId ?? ''));
	const masterReleaseId = present
		? present.rewardProvenance?.sourceMasterReleaseId
		: liveId.length > 0
			? routeContext.resolveRequestMasterRelease(c, user).masterReleaseId
			: collection?.currentWithstationArchiveMasterReleaseId;
	const database = resolveMasterReleaseBoundSessionDatabase(c, routeContext, {
		masterReleaseId,
	});
	if (database instanceof Response) return database;
	if (masterReleaseId === undefined)
		return routeContext.respondError(c, 'sessionMasterReleaseUnavailable');
	const master = getWithStationPrizeMasterFromDatabase(database, targetLiveId);
	const provenance = getGiftLiveProvenance(
		database,
		masterReleaseId,
		'withstation',
		targetLiveId,
	);
	if (
		master === undefined ||
		provenance === undefined ||
		(present !== undefined &&
			!isSameEntityIdentity(
				present.rewardProvenance?.identityFingerprint,
				provenance.identityFingerprint,
			))
	) {
		return routeContext.respondError(c, 'withstationPrizeNotFound');
	}
	const presentBox =
		existingPresentBox ??
		ensureUserPresentBox(routeContext.state, user.playerId).value;
	return { user, presentBox, present, master, provenance, database };
}
