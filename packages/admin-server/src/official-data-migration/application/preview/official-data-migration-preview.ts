import type {
	JsonRecord,
	OfficialApiDumpEvent,
} from '@altair/admin-server/official-data-migration/application/official-data-migration-dump.ts';
import type { OfficialDataMigrationPreview } from '@altair/runtime/admin/dto/official-data-migration.ts';
import { createOfficialDataMigrationCategoryPreviews } from './official-data-migration-preview-coverage.ts';
import { readOfficialDataMigrationPreviewFields } from './official-data-migration-preview-fields.ts';

export function buildOfficialDataMigrationPreview(
	manifest: JsonRecord,
	events: OfficialApiDumpEvent[],
	errors: string[],
): OfficialDataMigrationPreview {
	return {
		...readOfficialDataMigrationPreviewFields(manifest),
		totalEvents: events.length,
		categories: createOfficialDataMigrationCategoryPreviews(events),
		errors: [...errors],
	};
}
