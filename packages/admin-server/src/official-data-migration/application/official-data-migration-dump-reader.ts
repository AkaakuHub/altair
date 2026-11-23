import type { OfficialDataMigrationDump } from './official-data-migration-dump.ts';

export type OfficialDataMigrationDumpReader = {
	read(data: Uint8Array): OfficialDataMigrationDump;
};
