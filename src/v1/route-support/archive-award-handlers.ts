import type { Context } from 'hono';
import { addArchiveGiftPointAndPrizePresents } from '../../application/archive-prize-gift-points.ts';
import { allocateArchivePrizeStars } from '../../application/archive-prize-star-allocation.ts';
import { readPrizeStarAllocations } from '../../application/prize-star-allocations.ts';
import {
	getGiftLiveIdentityFingerprint,
	getGiftLiveProvenance,
} from '../../master-data/archive-identity.ts';
import { getArchivePrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { getMemberFanLevelTableFromDatabase } from '../../master-data/member-fan-level-master.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { ensureUserPresentBox } from '../../state/user-presents-state.ts';
import { readJson } from '../http/read-json.ts';
import { createArchiveGiftResponse } from '../responses/archive-award-response.ts';
import { consumeGiftShopItem } from './archive-gift-shop.ts';
import { getArchiveMasterReleaseSession } from './archive-master-release-session.ts';
import { respondArchivePrizePreview } from './archive-prize-preview.ts';
import {
	readArchiveGiftRequest,
	readArchiveStarsRequest,
} from './archive-request.ts';
import { persistRouteState, withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createArchiveGiftHandler(routeContext: StateRouteContext) {
	return async (c: Context) => {
		const session = getArchiveMasterReleaseSession(c, routeContext);
		if (session instanceof Response) return session;
		const { liveId, userItemId, useOwnAmount } = readArchiveGiftRequest(
			await readJson(c.req.raw),
		);
		const archivePrizeMaster = getArchivePrizeMasterFromDatabase(
			session.database,
			liveId,
		);
		if (liveId.length === 0 || archivePrizeMaster === undefined)
			return routeContext.respondError(c, 'withliveGiftItemNotFound');
		const liveProvenance = getGiftLiveProvenance(
			session.database,
			session.masterReleaseId,
			'withlive',
			liveId,
		);
		if (liveProvenance === undefined)
			return routeContext.respondError(c, 'withliveGiftItemNotFound');
		const inventory = ensureUserInventory(
			routeContext.state,
			session.user.playerId,
			routeContext.userItemsGetList,
		).value;
		const userGiftPoint = consumeGiftShopItem(
			session.database,
			session.masterReleaseId,
			liveId,
			'withlive',
			inventory,
			userItemId,
			useOwnAmount,
		);
		if (userGiftPoint === undefined)
			return routeContext.respondError(c, 'withliveGiftItemNotFound');
		const presentBox = ensureUserPresentBox(
			routeContext.state,
			session.user.playerId,
		).value;
		const result = addArchiveGiftPointAndPrizePresents(
			routeContext.state,
			presentBox,
			session.user.playerId,
			liveId,
			userGiftPoint,
			archivePrizeMaster,
			liveProvenance,
			liveProvenance,
		);
		persistRouteState(routeContext);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(
			createArchiveGiftResponse(userGiftPoint, result.totalUserGiftPoint),
		);
	};
}

export function createArchivePrizeGetHandler(routeContext: StateRouteContext) {
	return (c: Context) =>
		respondArchivePrizePreview(
			c,
			routeContext,
			c.req.query('present_box_id') ?? '',
		);
}
export function createArchivePrizePostHandler(routeContext: StateRouteContext) {
	return async (c: Context) => {
		const { presentBoxId } = readArchiveStarsRequest(await readJson(c.req.raw));
		return respondArchivePrizePreview(c, routeContext, presentBoxId);
	};
}

export function createArchiveStarsHandler(routeContext: StateRouteContext) {
	return async (c: Context) =>
		withRequestUser(c, routeContext, async (user) => {
			const { presentBoxId, setStarJson } = readArchiveStarsRequest(
				await readJson(c.req.raw),
			);
			const allocations = readPrizeStarAllocations(setStarJson);
			if (allocations === undefined)
				return routeContext.respondError(c, 'archiveGiftStateNotFound');
			const presentBox = ensureUserPresentBox(
				routeContext.state,
				user.playerId,
			).value;
			const database = routeContext.resolveMasterDatabase(c, user);
			if (
				presentBoxId.length === 0 ||
				!allocateArchivePrizeStars(
					routeContext.state,
					user.playerId,
					presentBox,
					presentBoxId,
					allocations,
					routeContext.resolveUserStatus(c, user),
					getMemberFanLevelTableFromDatabase(database),
					getGiftLiveIdentityFingerprint(
						database,
						'withlive',
						presentBox.presentList.find(
							(present) => present.d_present_boxes_id === presentBoxId,
						)?.live_id ?? '',
					),
				)
			)
				return routeContext.respondError(c, 'archiveGiftStateNotFound');
			persistRouteState(routeContext);
			return new Response(null, { status: 200 });
		});
}
