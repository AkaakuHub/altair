import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { assertOfficialDataMigrationAppliedCategoryCoverage } from '../domain/official-data-migration-applied-category-coverage.ts';
import { createOfficialDataMigrationApplyResultCollector } from './official-data-migration-apply-result-collector.ts';
import type { OfficialDataMigrationDump } from './official-data-migration-dump.ts';
import {
	applyOfficialDataMigrationFeatures,
	type OfficialDataMigrationFeatureOptions,
} from './official-data-migration-feature-dispatch.ts';

export type OfficialDataMigrationApplyOptions =
	OfficialDataMigrationFeatureOptions;

export function orchestrateOfficialDataMigrationCategories(
	state: ServerState,
	dump: OfficialDataMigrationDump,
	userStatus: UserStatusController,
	database: Database,
	playerId: string,
	options: OfficialDataMigrationApplyOptions,
): { appliedCategories: string[]; errors: string[] } {
	const collector = createOfficialDataMigrationApplyResultCollector(dump);
	applyOfficialDataMigrationFeatures(
		state,
		dump,
		userStatus,
		database,
		playerId,
		options,
		collector,
	);
	assertOfficialDataMigrationAppliedCategoryCoverage(
		collector.result.appliedCategories,
	);
	if (state.selectedAdminPlayerId === null)
		state.selectedAdminPlayerId = playerId;
	return collector.result;
}

import type { Database } from 'bun:sqlite';
