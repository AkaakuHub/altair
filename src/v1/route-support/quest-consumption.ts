import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { consumeUserItem } from '../../state/user-item-mutation.ts';
import { consumeUserStamina } from '../../state/user-status-stamina.ts';
import {
	lookupDreamQuestStageUseCostFromDatabase,
	lookupQuestStageUseNumFromDatabase,
} from '../active-master-database/quest-stage-data.ts';
import { createMasterReleaseItemProvenance } from './item-consumption.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function consumeQuestPlayPoint(
	c: Context,
	routeContext: StateRouteContext,
	stageId: number,
	playCount = 1,
	database?: Database,
): boolean {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return false;
	}
	if (!Number.isSafeInteger(playCount) || playCount < 1) {
		return false;
	}
	return consumeUserStamina(
		routeContext
			.resolveUserStatus(c, user)
			.ensure(routeContext.state, user.playerId).value,
		lookupQuestStageUseNumFromDatabase(
			database ?? routeContext.resolveMasterDatabase(c, user),
			stageId,
		) * playCount,
		routeContext.date.currentDate(),
	);
}

export function consumeDreamQuestItem(
	c: Context,
	routeContext: StateRouteContext,
	stageId: number,
	masterReleaseId: string | undefined,
): boolean {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return false;
	}
	if (masterReleaseId === undefined) return false;
	const database = routeContext.resolveMasterReleaseDatabase(masterReleaseId);
	const cost = lookupDreamQuestStageUseCostFromDatabase(database, stageId);
	if (cost?.useType !== 2 || cost.useItem <= 0 || cost.useNum <= 0) {
		return false;
	}
	const { value: inventory } = ensureUserInventory(
		routeContext.state,
		user.playerId,
		routeContext.userItemsGetList,
	);
	const provenance = createMasterReleaseItemProvenance(
		database,
		masterReleaseId,
		cost.useItem,
	);
	return (
		provenance !== undefined &&
		consumeUserItem(inventory, '', cost.useItem, cost.useNum, provenance)
	);
}
