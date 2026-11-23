import type { OfficialDataMigrationApplyResult } from '@altair/runtime/admin/dto/official-data-migration.ts';
import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import {
	type OfficialDataMigrationApplyOptions,
	orchestrateOfficialDataMigrationCategories,
} from './official-data-migration-category-orchestrator.ts';
import type { OfficialDataMigrationDump } from './official-data-migration-dump.ts';
import {
	createMissingPlayerMigrationResult,
	createOfficialDataMigrationApplyResult,
} from './official-data-migration-result-factory.ts';

export function applyOfficialDataMigrationDump(
	state: ServerState,
	dump: OfficialDataMigrationDump,
	userStatus: UserStatusController,
	database: Database,
	options: OfficialDataMigrationApplyOptions = { accountLinkIdToken: '' },
): OfficialDataMigrationApplyResult {
	const playerId = dump.preview.playerId;
	if (playerId === null) {
		return createMissingPlayerMigrationResult(dump);
	}
	const result = orchestrateOfficialDataMigrationCategories(
		state,
		dump,
		userStatus,
		database,
		playerId,
		options,
	);
	return createOfficialDataMigrationApplyResult(
		dump,
		playerId,
		result.appliedCategories,
		result.errors,
	);
}

import type { Database } from 'bun:sqlite';
