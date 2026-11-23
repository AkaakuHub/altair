import { officialDataMigrationCategoryMapping } from './official-data-migration-category-mapping.ts';

const derivedAppliedCategories = new Set([
	'accountLinks',
	'userProfileDesigns',
	'userShopExchanges',
]);

const mappedCategories: ReadonlySet<string> = new Set(
	officialDataMigrationCategoryMapping.map((definition) => definition.category),
);

export function assertOfficialDataMigrationAppliedCategoryCoverage(
	appliedCategories: readonly string[],
): void {
	for (const category of appliedCategories) {
		if (
			!mappedCategories.has(category) &&
			!derivedAppliedCategories.has(category)
		) {
			throw new Error(
				`official migration applied category is unmapped: ${category}`,
			);
		}
	}
}
