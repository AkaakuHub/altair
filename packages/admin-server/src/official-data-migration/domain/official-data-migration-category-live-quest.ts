import type { OfficialDataMigrationCategoryDefinition } from './official-data-migration-category-definition.ts';

export const officialDataMigrationLiveQuestCategories = [
	{
		category: 'userLives',
		sourceEndpoint: '/v1/out_quest_live/get_quest_top',
		appliesToState: true,
	},
	{
		category: 'userDreamLiveProgress',
		sourceEndpoint: '/v1/out_quest_live/get_quest_top',
		appliesToState: true,
	},
	{
		category: 'userLiveStaminaRecovery',
		sourceEndpoint: '/v1/out_quest_live/get_stamina_recovery_info',
		appliesToState: true,
	},
	{
		category: 'userGradeQuestProgress',
		sourceEndpoint: '/v1/out_quest_live/grade/get_quest_list',
		appliesToState: true,
	},
	{
		category: 'userGradeChallengeProgress',
		sourceEndpoint: '/v1/out_quest_live/grade_challenge/get_quest_list',
		appliesToState: true,
	},
	{
		category: 'userStandardQuestProgress',
		sourceEndpoint: '/v1/out_quest_live/standard/get_stage_select',
		appliesToState: true,
	},
	{
		category: 'userGrandPrixTop',
		sourceEndpoint: '/v1/out_quest_live/grand_prix/get_top_info',
		appliesToState: false,
	},
	{
		category: 'userGrandPrixStageSelect',
		sourceEndpoint: '/v1/out_quest_live/grand_prix/get_stage_select',
		appliesToState: true,
	},
	{
		category: 'userGrandPrixHistory',
		sourceEndpoint: '/v1/out_quest_live/grand_prix/get_history',
		appliesToState: false,
	},
	{
		category: 'userDailyQuestStates',
		sourceEndpoint: '/v1/out_quest_live/daily/get_stage_select',
		appliesToState: true,
	},
	{
		category: 'userDailyQuestRecoveryCounts',
		sourceEndpoint: '/v1/out_quest_live/daily/get_recovery_challenge_count',
		appliesToState: true,
	},
	{
		category: 'userLearningMusicMasteries',
		sourceEndpoint: '/v1/out_quest_live/music_learning/get_music_select',
		appliesToState: true,
	},
] as const satisfies readonly OfficialDataMigrationCategoryDefinition[];
