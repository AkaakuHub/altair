import type { OfficialDataMigrationCategoryDefinition } from './official-data-migration-category-definition.ts';

export const officialDataMigrationRhythmChapterCategories = [
	{
		category: 'userRhythmGame',
		sourceEndpoint: '/v1/rhythm_game/home',
		appliesToState: true,
	},
	{
		category: 'userRhythmGameGrandPrix',
		sourceEndpoint: '/v1/rhythm_game_grand_prix/top',
		appliesToState: true,
	},
	{
		category: 'userChapters',
		sourceEndpoint: '/v1/chapter/home',
		appliesToState: true,
	},
	{
		category: 'userChapterMissions',
		sourceEndpoint: '/v1/chapter/category_info',
		appliesToState: true,
	},
	{
		category: 'userChapterPointRewards',
		sourceEndpoint: '/v1/chapter/get_point_rewards',
		appliesToState: true,
	},
] as const satisfies readonly OfficialDataMigrationCategoryDefinition[];
