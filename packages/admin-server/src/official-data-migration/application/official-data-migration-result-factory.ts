import type { OfficialDataMigrationApplyResult } from '@altair/runtime/admin/dto/official-data-migration.ts';
import type { OfficialDataMigrationDump } from './official-data-migration-dump.ts';

export function createMissingPlayerMigrationResult(
	dump: OfficialDataMigrationDump,
): OfficialDataMigrationApplyResult {
	return {
		playerId: '',
		appliedCategories: [],
		skippedCategories: dump.preview.categories.map(
			(category) => category.category,
		),
		errors: [...dump.preview.errors, 'manifest.player_id is missing'],
	};
}

export function createOfficialDataMigrationApplyResult(
	dump: OfficialDataMigrationDump,
	playerId: string,
	appliedCategories: string[],
	errors: string[],
): OfficialDataMigrationApplyResult {
	return {
		playerId,
		appliedCategories,
		skippedCategories: dump.preview.categories
			.filter((category) => !category.appliesToState)
			.map((category) => category.category),
		errors,
	};
}
