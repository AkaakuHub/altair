import type { Context } from 'hono';
import { shouldAddActivityRecordFirstWatchPresent } from '../../application/activity-record-play-service.ts';
import { addActivityRecordFirstWatchPresents } from '../../application/activity-record-watch-reward-service.ts';
import { createPresentRewardProvenance } from '../../application/present-reward-provenance.ts';
import { runRewardClaimMutation } from '../../application/reward-claim-service.ts';
import { projectUserInventory } from '../../application/user-owned-master-projection.ts';
import {
	getActivityRecordAdvProvenanceFromDatabase,
	getActivityRecordAdvUnlockMasterFromDatabase,
	getActivityRecordAdvWatchRewardMasterFromDatabase,
	getActivityRecordMasterIdentityCatalogFromDatabase,
	isLatestActivityRecordSeriesInDatabase,
} from '../../master-data/activity-record-master.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import {
	isActivityRecordAdvUnlockConditionSatisfied,
	playActivityRecordAdvData,
	unlockActivityRecordAdvData,
} from '../../state/activity-record-mutation.ts';
import { projectActivityRecordState } from '../../state/activity-record-projection.ts';
import {
	ensureUserInventory,
	findUserItemByItemId,
} from '../../state/user-inventory-aggregate.ts';
import { consumeUserItem } from '../../state/user-item-mutation.ts';
import { ensureUserPresentBox } from '../../state/user-presents-state.ts';
import { readJson } from '../http/read-json.ts';
import {
	createActivityRecordPlayAdvDataResponse,
	createActivityRecordSetWatchableStatusResponse,
	createActivityRecordTopResponse,
} from '../responses/app-content-response.ts';
import { createMasterReleaseItemProvenance } from './item-consumption.ts';
import { getNumberField } from './request-fields.ts';
import { ensureRouteUserActivityRecordState } from './request-user-state.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getActivityRecordTop(
	c: Context,
	context: StateRouteContext,
): Response {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	const activityRecordResult = ensureRouteUserActivityRecordState(
		context,
		user.playerId,
	);
	const inventoryResult = ensureUserInventory(
		context.state,
		user.playerId,
		context.userItemsGetList,
	);
	persistRouteStateIfChanged(
		context,
		activityRecordResult.created || inventoryResult.created,
	);
	const database = context.resolveMasterDatabase(c, user);
	return c.json(
		createActivityRecordTopResponse(
			database,
			activityRecordResult.value,
			projectUserInventory(
				inventoryResult.value,
				createUserOwnedMasterSupport(database),
			),
		),
	);
}

export async function setActivityRecordWatchableStatus(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const body = await readJson(c.req.raw);
	const advDataId = getNumberField(body, 'adv_data_id');
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	if (advDataId === undefined)
		return context.respondError(c, 'userItemNotFound');
	const masterRelease = context.resolveRequestMasterRelease(c, user);
	const master = getActivityRecordAdvUnlockMasterFromDatabase(
		masterRelease.database,
		advDataId,
	);
	if (!master || master.advUnlockItemId <= 0 || master.advUnlockItemNum <= 0)
		return context.respondError(c, 'userItemNotFound');
	const activityProvenance = getActivityRecordAdvProvenanceFromDatabase(
		masterRelease.database,
		masterRelease.masterReleaseId,
		advDataId,
	);
	if (activityProvenance === undefined)
		return context.respondError(c, 'userItemNotFound');
	const { value: inventory } = ensureUserInventory(
		context.state,
		user.playerId,
		context.userItemsGetList,
	);
	const activityRecord = ensureRouteUserActivityRecordState(
		context,
		user.playerId,
	).value;
	if (
		!isActivityRecordAdvUnlockConditionSatisfied(
			activityRecord,
			master.advUnlockConditionValue,
			getActivityRecordMasterIdentityCatalogFromDatabase(
				masterRelease.database,
			).advFingerprints.get(master.advUnlockConditionValue),
		)
	)
		return context.respondError(c, 'userItemNotFound');
	const provenance = createMasterReleaseItemProvenance(
		masterRelease.database,
		masterRelease.masterReleaseId,
		master.advUnlockItemId,
	);
	if (
		provenance === undefined ||
		!consumeUserItem(
			inventory,
			'',
			master.advUnlockItemId,
			master.advUnlockItemNum,
			provenance,
		)
	)
		return context.respondError(c, 'userItemInsufficient');
	unlockActivityRecordAdvData(activityRecord, advDataId, activityProvenance);
	persistRouteState(context);
	return c.json(
		createActivityRecordSetWatchableStatusResponse(
			1,
			findUserItemByItemId(inventory, master.advUnlockItemId)?.itemNum ?? 0,
		),
	);
}

export async function playActivityRecordAdv(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	const activityRecord = ensureRouteUserActivityRecordState(
		context,
		user.playerId,
	).value;
	const masterRelease = context.resolveRequestMasterRelease(c, user);
	const database = masterRelease.database;
	const body = await readJson(c.req.raw);
	const advDataId = getNumberField(body, 'adv_data_id');
	if (advDataId === undefined)
		return context.respondError(c, 'userItemNotFound');
	const watchRewardMaster = getActivityRecordAdvWatchRewardMasterFromDatabase(
		database,
		advDataId,
	);
	if (watchRewardMaster === undefined)
		return context.respondError(c, 'userItemNotFound');
	const activityProvenance = getActivityRecordAdvProvenanceFromDatabase(
		database,
		masterRelease.masterReleaseId,
		advDataId,
	);
	if (activityProvenance === undefined)
		return context.respondError(c, 'userItemNotFound');
	const shouldAddPresent = shouldAddActivityRecordFirstWatchPresent(
		activityRecord,
		advDataId,
		isLatestActivityRecordSeriesInDatabase(
			database,
			watchRewardMaster.advSeriesId,
		),
		activityProvenance.identityFingerprint,
	);
	runRewardClaimMutation(context.state, () => {
		playActivityRecordAdvData(activityRecord, advDataId, activityProvenance);
		if (shouldAddPresent)
			addActivityRecordFirstWatchPresents(
				ensureUserPresentBox(context.state, activityRecord.playerId).value,
				watchRewardMaster.watchRewardList,
				(itemId) => getItemDefinitionByItemIdFromDatabase(database, itemId),
				(itemId, itemType) =>
					createPresentRewardProvenance(
						database,
						masterRelease.masterReleaseId,
						itemId,
						itemType,
					),
			);
		context
			.resolveMissionProgress(c, user)
			.syncUserContent(activityRecord.playerId, {
				activityRecord: projectActivityRecordState(
					activityRecord,
					getActivityRecordMasterIdentityCatalogFromDatabase(database),
				),
			});
	});
	persistRouteState(context);
	context.applyResponseHeaders(c, context.defaultHeaders);
	return c.json(
		createActivityRecordPlayAdvDataResponse(watchRewardMaster.watchRewardList),
	);
}
