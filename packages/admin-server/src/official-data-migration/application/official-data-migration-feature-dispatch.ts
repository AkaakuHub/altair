import type { Database } from 'bun:sqlite';
import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import type { OfficialDataMigrationDump } from './official-data-migration-dump.ts';
import { applyOfficialDataMigrationAccountFeatures } from './official-data-migration-feature-account.ts';
import { applyOfficialDataMigrationCollectionFeatures } from './official-data-migration-feature-collection.ts';
import { applyOfficialDataMigrationProgressionFeatures } from './official-data-migration-feature-progression.ts';
import type { OfficialDataMigrationApplyResultCollector } from './official-data-migration-feature-types.ts';

export type OfficialDataMigrationFeatureOptions = {
	accountLinkIdToken: string;
};

export function applyOfficialDataMigrationFeatures(
	state: ServerState,
	dump: OfficialDataMigrationDump,
	userStatus: UserStatusController,
	database: Database,
	playerId: string,
	options: OfficialDataMigrationFeatureOptions,
	collector: OfficialDataMigrationApplyResultCollector,
): void {
	const inventoryImported = applyOfficialDataMigrationAccountFeatures(
		state,
		dump,
		userStatus,
		playerId,
		options.accountLinkIdToken,
		collector,
	);
	applyOfficialDataMigrationProgressionFeatures(
		state,
		dump,
		playerId,
		collector,
		database,
	);
	applyOfficialDataMigrationCollectionFeatures(
		state,
		dump,
		userStatus,
		playerId,
		inventoryImported,
		collector,
		database,
	);
}
