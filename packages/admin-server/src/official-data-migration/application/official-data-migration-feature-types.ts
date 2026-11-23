import type { createOfficialDataMigrationApplyResultCollector } from './official-data-migration-apply-result-collector.ts';

export type OfficialDataMigrationApplyResultCollector = ReturnType<
	typeof createOfficialDataMigrationApplyResultCollector
>;
