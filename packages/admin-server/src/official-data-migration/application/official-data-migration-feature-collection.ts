import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { setArchiveGiftPoint } from '../../../../../src/state/archive-gift-state.ts';
import type { OfficialDataMigrationDump } from './official-data-migration-dump.ts';
import type { OfficialDataMigrationApplyResultCollector } from './official-data-migration-feature-types.ts';
import { createActivityRecordFromResponse } from './projectors/official-data-migration-activity-record.ts';
import { createCircleFromResponse } from './projectors/official-data-migration-apply-circle.ts';
import { applyOfficialDataMigrationItemQuantities } from './projectors/official-data-migration-apply-item-quantities.ts';
import {
	createShopExchangeFromDump,
	createSiscaStoreFromResponse,
	mergeMigratedShopExchange,
} from './projectors/official-data-migration-apply-shop.ts';
import { upsertMigrationPlayerState } from './projectors/official-data-migration-apply-upsert.ts';
import {
	createArchiveCollectionFromDump,
	mergeMigratedArchiveCollection,
} from './projectors/official-data-migration-archive-collection.ts';
import { createArchiveGiftPointsFromDump } from './projectors/official-data-migration-archive-gift-points.ts';
import { applySocialFromDump } from './projectors/official-data-migration-social-orchestrator.ts';

export function applyOfficialDataMigrationCollectionFeatures(
	state: ServerState,
	dump: OfficialDataMigrationDump,
	userStatus: UserStatusController,
	playerId: string,
	inventoryImported: boolean,
	collector: OfficialDataMigrationApplyResultCollector,
	database: Database,
): void {
	const shopExchange = createShopExchangeFromDump(playerId, dump);
	if (shopExchange !== null) {
		upsertMigrationPlayerState(
			state.userShopExchanges,
			mergeMigratedShopExchange(
				state.userShopExchanges.find((entry) => entry.playerId === playerId),
				shopExchange,
			),
		);
		collector.addCategory('userShopExchanges');
	}
	const siscaStore = createSiscaStoreFromResponse(
		playerId,
		dump.responsesByPath.get('/v1/sisca_store/get_list'),
	);
	if (siscaStore !== null) {
		upsertMigrationPlayerState(state.userSiscaStores, siscaStore);
		collector.addCategory('userSiscaStores');
	}
	if (
		inventoryImported &&
		applyOfficialDataMigrationItemQuantities(state, playerId, dump, database)
	) {
		collector.addCategory('userInventories');
	}
	const archiveCollection = createArchiveCollectionFromDump(playerId, dump);
	if (archiveCollection !== null) {
		upsertMigrationPlayerState(
			state.userArchiveCollections,
			mergeMigratedArchiveCollection(
				state.userArchiveCollections.find(
					(entry) => entry.playerId === playerId,
				),
				archiveCollection,
			),
		);
		collector.addCategory('userArchiveCollections');
	}
	const archiveGiftPoints = createArchiveGiftPointsFromDump(playerId, dump);
	if (archiveGiftPoints.length > 0) {
		for (const point of archiveGiftPoints) {
			state.archiveGiftPoints = setArchiveGiftPoint(
				state.archiveGiftPoints,
				point,
			);
		}
		collector.addCategory('archiveGiftPoints');
	}
	const activityRecord = createActivityRecordFromResponse(
		playerId,
		dump.responsesByPath.get('/v1/activity_record/get_top'),
	);
	if (activityRecord !== null) {
		upsertMigrationPlayerState(state.userActivityRecords, activityRecord);
		collector.addCategory('userActivityRecords');
	}
	collector.addCategories(applySocialFromDump(state, playerId, dump));
	const circle = createCircleFromResponse(
		state,
		dump.responsesByPath.get('/v1/circle/get_circle_top_info'),
		dump.responsesByPath.get('/v1/circle/get_chat_log_list'),
		dump.responsesByPath.get('/v1/circle/get_invite_and_join_info'),
		userStatus,
	);
	if (circle !== null) {
		state.circle = circle;
		collector.addCategory('circle');
	}
}

import type { Database } from 'bun:sqlite';
