import type { OfficialDataMigrationCategoryDefinition } from './official-data-migration-category-definition.ts';

export const officialDataMigrationCollectionCommerceCategories = [
	{
		category: 'userGachas',
		sourceEndpoint: '/v1/gacha/get_series_list',
		appliesToState: true,
	},
	{
		category: 'userGachaGuaranteePoints',
		sourceEndpoint: '/v1/gacha/get_guarantee_point_list',
		appliesToState: true,
	},
	{
		category: 'userGachaExchangeCardHaving',
		sourceEndpoint: '/v1/gacha/get_exchange_card_having_list',
		appliesToState: true,
	},
	{
		category: 'userSelectTicketExchanges',
		sourceEndpoint: '/v1/select_ticket_exchange/get_list',
		appliesToState: false,
	},
	{
		category: 'userPresentBoxes',
		sourceEndpoint: '/v1/present_box/get_list',
		appliesToState: true,
	},
	{
		category: 'userPresentBoxHistory',
		sourceEndpoint: '/v1/present_box/get_history',
		appliesToState: true,
	},
	{
		category: 'userArchiveCollections',
		sourceEndpoint: '/v1/archive/get_home',
		appliesToState: true,
	},
	{
		category: 'userArchiveList',
		sourceEndpoint: '/v1/archive/get_archive_list',
		appliesToState: true,
	},
	{
		category: 'userArchiveWithliveDetails',
		sourceEndpoint: '/v1/archive/withlive_info',
		appliesToState: true,
	},
	{
		category: 'userArchiveFesDetails',
		sourceEndpoint: '/v1/archive/get_fes_archive_data',
		appliesToState: true,
	},
	{
		category: 'archiveGiftPoints',
		sourceEndpoint: '/v1/archive/withlive_prize',
		appliesToState: true,
	},
	{
		category: 'userActivityRecords',
		sourceEndpoint: '/v1/activity_record/get_top',
		appliesToState: true,
	},
	{
		category: 'userCollectionGallary',
		sourceEndpoint: '/v1/collection/get_gallary_list',
		appliesToState: false,
	},
	{
		category: 'userCollectionMusic',
		sourceEndpoint: '/v1/collection/get_music_list',
		appliesToState: false,
	},
	{
		category: 'userCollectionStickers',
		sourceEndpoint: '/v1/collection/get_sticker_list',
		appliesToState: true,
	},
	{
		category: 'userMissions',
		sourceEndpoint: '/v1/mission/get_list',
		appliesToState: true,
	},
	{
		category: 'userBeginnerMissions',
		sourceEndpoint: '/v1/beginner_mission/get_list',
		appliesToState: true,
	},
	{
		category: 'userStepUpBeginnerMissions',
		sourceEndpoint: '/v1/step_up_beginner_mission/get_list',
		appliesToState: true,
	},
	{
		category: 'userShops',
		sourceEndpoint: '/v1/shop/get_list',
		appliesToState: true,
	},
	{
		category: 'userPetalExchanges',
		sourceEndpoint: '/v1/petal_exchange/get_list',
		appliesToState: true,
	},
	{
		category: 'userGpPrizeExchanges',
		sourceEndpoint: '/v1/gp_prize_exchange/get_list',
		appliesToState: true,
	},
	{
		category: 'userItemExchanges',
		sourceEndpoint: '/v1/item_exchange/get_list_new',
		appliesToState: true,
	},
	{
		category: 'userLimitBreakMaterialConvertExchanges',
		sourceEndpoint: '/v1/item_exchange/get_limit_break_material_convert_list',
		appliesToState: false,
	},
	{
		category: 'userStickerExchanges',
		sourceEndpoint: '/v1/sticker_exchange/get_list',
		appliesToState: false,
	},
	{
		category: 'userSiscaStores',
		sourceEndpoint: '/v1/sisca_store/get_list',
		appliesToState: true,
	},
] as const satisfies readonly OfficialDataMigrationCategoryDefinition[];
