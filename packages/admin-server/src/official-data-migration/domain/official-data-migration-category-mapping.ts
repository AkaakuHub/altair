import { officialDataMigrationAccountSocialCategories } from './official-data-migration-category-account-social.ts';
import { officialDataMigrationCollectionCommerceCategories } from './official-data-migration-category-collection-commerce.ts';
import { officialDataMigrationLiveQuestCategories } from './official-data-migration-category-live-quest.ts';
import { officialDataMigrationRhythmChapterCategories } from './official-data-migration-category-rhythm-chapter.ts';

export const officialDataMigrationCategoryMapping = [
	...officialDataMigrationAccountSocialCategories,
	...officialDataMigrationCollectionCommerceCategories,
	...officialDataMigrationLiveQuestCategories,
	...officialDataMigrationRhythmChapterCategories,
] as const;
