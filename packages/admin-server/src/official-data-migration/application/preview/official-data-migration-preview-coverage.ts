import type { OfficialApiDumpEvent } from '@altair/admin-server/official-data-migration/application/official-data-migration-dump.ts';
import { officialDataMigrationCategoryMapping } from '@altair/admin-server/official-data-migration/domain/official-data-migration-category-mapping.ts';
import type { OfficialDataMigrationCategoryPreview } from '@altair/runtime/admin/dto/official-data-migration.ts';

export function createOfficialDataMigrationCategoryPreviews(
	events: OfficialApiDumpEvent[],
): OfficialDataMigrationCategoryPreview[] {
	const responseCounts = countResponsesByPath(events);
	return officialDataMigrationCategoryMapping.map((category) => {
		const responseCount = responseCounts.get(category.sourceEndpoint) ?? 0;
		return {
			category: category.category,
			sourceEndpoint: category.sourceEndpoint,
			status:
				responseCount > 0
					? category.appliesToState
						? 'captured'
						: 'not_applied'
					: 'missing',
			responseCount,
			appliesToState: category.appliesToState,
		};
	});
}

export function countResponsesByPath(
	events: OfficialApiDumpEvent[],
): Map<string, number> {
	const counts = new Map<string, number>();
	for (const event of events) {
		if (event.path === null || event.response === null) {
			continue;
		}
		counts.set(event.path, (counts.get(event.path) ?? 0) + 1);
	}
	return counts;
}
