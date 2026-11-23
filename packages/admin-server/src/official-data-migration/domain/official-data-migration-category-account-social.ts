import type { OfficialDataMigrationCategoryDefinition } from './official-data-migration-category-definition.ts';

export const officialDataMigrationAccountSocialCategories = [
	{
		category: 'registeredUsers',
		sourceEndpoint: '/v1/profile/get_info',
		appliesToState: true,
	},
	{
		category: 'userHeaders',
		sourceEndpoint: '/v1/home/get_home',
		appliesToState: true,
	},
	{
		category: 'userTutorials',
		sourceEndpoint: '/v1/user/login',
		appliesToState: true,
	},
	{
		category: 'contentReleaseEffects',
		sourceEndpoint: '/v1/user/set_contents_release_effect_history',
		appliesToState: true,
	},
	{
		category: 'userInventories',
		sourceEndpoint: '/v1/user/items/get_list',
		appliesToState: true,
	},
	{
		category: 'userCards',
		sourceEndpoint: '/v1/user/card/get_list',
		appliesToState: true,
	},
	{
		category: 'userDecks',
		sourceEndpoint: '/v1/user/deck/get_list',
		appliesToState: true,
	},
	{
		category: 'userCardDetails',
		sourceEndpoint: '/v1/user/card/get_detail',
		appliesToState: false,
	},
	{
		category: 'userProfileSettings',
		sourceEndpoint: '/v1/home/get_custom_setting',
		appliesToState: true,
	},
	{
		category: 'userProfileWallpaperSettings',
		sourceEndpoint: '/v1/home/get_wallpaper_setting',
		appliesToState: true,
	},
	{
		category: 'userProfileDesignCards',
		sourceEndpoint: '/v1/profile/get_my_design_card_list',
		appliesToState: true,
	},
	{
		category: 'userProfileDesignIcons',
		sourceEndpoint: '/v1/profile/get_my_design_icon_list',
		appliesToState: true,
	},
	{
		category: 'userProfileMuteList',
		sourceEndpoint: '/v1/profile/get_mute_list',
		appliesToState: true,
	},
	{
		category: 'userStatuses',
		sourceEndpoint: '/v1/profile/get_fan_level_info',
		appliesToState: true,
	},
	{
		category: 'followRelations',
		sourceEndpoint: '/v1/follow/get_list',
		appliesToState: true,
	},
	{
		category: 'userFriendCards',
		sourceEndpoint: '/v1/follow/get_follower_list',
		appliesToState: true,
	},
	{
		category: 'userSocials',
		sourceEndpoint: '/v1/follow/live_chat_group_list',
		appliesToState: false,
	},
	{
		category: 'circle',
		sourceEndpoint: '/v1/circle/get_circle_top_info',
		appliesToState: true,
	},
	{
		category: 'circleDetail',
		sourceEndpoint: '/v1/circle/get_detail',
		appliesToState: true,
	},
	{
		category: 'circleInfo',
		sourceEndpoint: '/v1/circle/get_info',
		appliesToState: true,
	},
	{
		category: 'circleChatLogs',
		sourceEndpoint: '/v1/circle/get_chat_log_list',
		appliesToState: true,
	},
	{
		category: 'userCircleInvites',
		sourceEndpoint: '/v1/circle/get_invite_list',
		appliesToState: true,
	},
	{
		category: 'userCircleNotifications',
		sourceEndpoint: '/v1/circle/get_invite_and_join_info',
		appliesToState: true,
	},
] as const satisfies readonly OfficialDataMigrationCategoryDefinition[];
