import type { Context } from 'hono';
import { resolveGachaPurchaseSourceMasterReleaseId } from '../../application/gacha-purchase-provenance.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { ensureUserGachaState } from '../../state/gacha-aggregate-state.ts';
import { resolveMasterReleaseBoundSessionDatabase } from './master-release-bound-session.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getGachaPurchaseMasterReleaseSession(
	c: Context,
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	gachaSeriesId: number | undefined,
) {
	const userGacha = ensureUserGachaState(
		routeContext.state,
		user.playerId,
	).value;
	const storedPurchasePlan = userGacha.purchasePlans.find(
		(plan) => plan.gachaSeriesId === gachaSeriesId,
	);
	const sourceMasterReleaseId = resolveGachaPurchaseSourceMasterReleaseId(
		storedPurchasePlan,
		() => routeContext.resolveRequestMasterRelease(c, user).masterReleaseId,
	);
	const database =
		storedPurchasePlan === undefined
			? routeContext.resolveMasterDatabase(c, user)
			: resolveMasterReleaseBoundSessionDatabase(
					c,
					routeContext,
					storedPurchasePlan,
				);
	if (database instanceof Response) return database;
	return { database, sourceMasterReleaseId, storedPurchasePlan, userGacha };
}
