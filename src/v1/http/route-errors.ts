import type { SessionErrorResponse } from '../response-types/common-response-types.ts';

export type RouteErrorCode =
	| 'accountLinkTargetNotFound'
	| 'requestUserNotFound'
	| 'archiveGiftStateNotFound'
	| 'beginnerMissionRewardSeedNotFound'
	| 'chapterCategoryNotFound'
	| 'contentsIdRequired'
	| 'deckModifyRequired'
	| 'dailyQuestTicketInsufficient'
	| 'displayCardIdRequired'
	| 'endpointNotImplemented'
	| 'followTargetNotFound'
	| 'gachaExchangeCardNotFound'
	| 'gachaGuaranteeExchangeInvalid'
	| 'gachaGuaranteeExchangeRateNotFound'
	| 'gachaGuaranteeExchangeRateRequired'
	| 'gachaPaidOnlyPurchaseLimitReached'
	| 'gachaPurchaseCostNotFound'
	| 'gachaPurchaseDrawRateNotFound'
	| 'gachaPurchasePlanNotFound'
	| 'gachaPurchaseSiscaInsufficient'
	| 'gachaPurchaseTypeRequired'
	| 'gachaSeriesRequired'
	| 'gachaSeriesSeedNotFound'
	| 'gpPrizeExchangeInvalid'
	| 'gpPrizeExchangeNotFound'
	| 'gpPrizeTicketInsufficient'
	| 'itemExchangeInvalid'
	| 'itemExchangeItemDefinitionNotFound'
	| 'itemExchangeNotFound'
	| 'liveBroadcastNotFound'
	| 'liveBroadcastGiftItemNotFound'
	| 'liveBroadcastMutationInvalid'
	| 'petalCoinInsufficient'
	| 'petalExchangeCardNotFound'
	| 'petalExchangeMaterialNotFound'
	| 'petalExchangePurchaseInvalid'
	| 'petalExchangeRateNotFound'
	| 'profileDesignCardIdRequired'
	| 'profileDesignIconIdRequired'
	| 'profileNameRequired'
	| 'profileTargetNotFound'
	| 'presentBoxItemNotFound'
	| 'playPointInsufficient'
	| 'questLiveNotStarted'
	| 'questLiveSettingInvalid'
	| 'rhythmGameClassMissionInvalid'
	| 'rhythmGameDeckRequired'
	| 'rhythmGameNotStarted'
	| 'selectTicketExchangeRateIdRequired'
	| 'selectTicketNotAvailable'
	| 'siscaPurchaseItemDefinitionNotFound'
	| 'siscaStoreInvalidPurchase'
	| 'siscaStoreItemIdRequired'
	| 'siscaStoreItemNotAvailable'
	| 'siscaStoreSiscaInsufficient'
	| 'stickerExchangeInvalid'
	| 'stickerExchangeNotFound'
	| 'stickerPointInsufficient'
	| 'seasonFanLevelPointStockInsufficient'
	| 'seasonFanLevelPointStockInvalid'
	| 'sessionMasterReleaseUnavailable'
	| 'userCardNotFound'
	| 'userCardMasterTemplateNotFound'
	| 'userCardEvolutionUnavailable'
	| 'userCardGrowthNotFound'
	| 'userOwnedEntityIncompatible'
	| 'userCardLimitBreakUnavailable'
	| 'userItemInsufficient'
	| 'userItemNotFound'
	| 'withliveGiftItemNotFound'
	| 'withstationGiftItemNotFound'
	| 'withstationMessageCardNotFound'
	| 'withstationPrizeNotFound';

export type RouteErrorDefinition = {
	error: string;
	status: 400 | 401 | 404 | 500 | 501;
	body?: SessionErrorResponse | undefined;
};

const routeErrors: Record<RouteErrorCode, RouteErrorDefinition> = {
	accountLinkTargetNotFound: {
		error: 'localify_account_link_target_not_found',
		status: 404,
	},
	requestUserNotFound: {
		error: 'localify_request_user_not_found',
		status: 401,
		body: {
			error_code: '00200_000001',
			message: '他の端末でログインしたため、ログアウトされました。',
			title: 'ログアウト',
		},
	},
	archiveGiftStateNotFound: {
		error: 'localify_archive_gift_state_not_found',
		status: 500,
	},
	beginnerMissionRewardSeedNotFound: {
		error: 'localify_beginner_mission_reward_seed_not_found',
		status: 404,
	},
	chapterCategoryNotFound: {
		error: 'localify_chapter_category_not_found',
		status: 404,
	},
	contentsIdRequired: {
		error: 'localify_contents_id_required',
		status: 400,
	},
	deckModifyRequired: {
		error: 'localify_deck_modify_required',
		status: 404,
	},
	dailyQuestTicketInsufficient: {
		error: 'localify_daily_quest_ticket_insufficient',
		status: 400,
	},
	displayCardIdRequired: {
		error: 'localify_display_card_id_required',
		status: 400,
	},
	endpointNotImplemented: {
		error: 'localify_endpoint_not_implemented',
		status: 501,
	},
	followTargetNotFound: {
		error: 'localify_follow_target_not_found',
		status: 404,
	},
	gachaExchangeCardNotFound: {
		error: 'localify_gacha_exchange_card_not_found',
		status: 404,
	},
	gachaGuaranteeExchangeInvalid: {
		error: 'localify_gacha_guarantee_exchange_invalid',
		status: 400,
	},
	gachaGuaranteeExchangeRateNotFound: {
		error: 'localify_gacha_guarantee_exchange_rate_not_found',
		status: 404,
	},
	gachaGuaranteeExchangeRateRequired: {
		error: 'localify_gacha_guarantee_exchange_rate_required',
		status: 400,
	},
	gachaPaidOnlyPurchaseLimitReached: {
		error: 'localify_gacha_paid_only_purchase_limit_reached',
		status: 400,
	},
	gachaPurchaseCostNotFound: {
		error: 'localify_gacha_purchase_cost_not_found',
		status: 404,
	},
	gachaPurchaseDrawRateNotFound: {
		error: 'localify_gacha_purchase_draw_rate_not_found',
		status: 404,
	},
	gachaPurchasePlanNotFound: {
		error: 'localify_gacha_purchase_plan_not_found',
		status: 404,
	},
	gachaPurchaseSiscaInsufficient: {
		error: 'localify_gacha_purchase_sisca_insufficient',
		status: 400,
	},
	gachaPurchaseTypeRequired: {
		error: 'localify_gacha_purchase_type_required',
		status: 400,
	},
	gachaSeriesRequired: {
		error: 'localify_gacha_series_required',
		status: 400,
	},
	gachaSeriesSeedNotFound: {
		error: 'localify_gacha_series_seed_not_found',
		status: 404,
	},
	gpPrizeExchangeInvalid: {
		error: 'localify_gp_prize_exchange_invalid',
		status: 400,
	},
	gpPrizeExchangeNotFound: {
		error: 'localify_gp_prize_exchange_not_found',
		status: 404,
	},
	gpPrizeTicketInsufficient: {
		error: 'localify_gp_prize_ticket_insufficient',
		status: 400,
	},
	itemExchangeInvalid: {
		error: 'localify_item_exchange_invalid',
		status: 400,
	},
	itemExchangeItemDefinitionNotFound: {
		error: 'localify_item_exchange_item_definition_not_found',
		status: 500,
	},
	itemExchangeNotFound: {
		error: 'localify_item_exchange_not_found',
		status: 404,
	},
	liveBroadcastNotFound: {
		error: 'localify_live_broadcast_not_found',
		status: 404,
	},
	liveBroadcastGiftItemNotFound: {
		error: 'localify_live_broadcast_gift_item_not_found',
		status: 404,
	},
	liveBroadcastMutationInvalid: {
		error: 'localify_live_broadcast_mutation_invalid',
		status: 400,
	},
	petalCoinInsufficient: {
		error: 'localify_petal_coin_insufficient',
		status: 400,
	},
	petalExchangeCardNotFound: {
		error: 'localify_petal_exchange_card_not_found',
		status: 404,
	},
	petalExchangeMaterialNotFound: {
		error: 'localify_petal_exchange_material_not_found',
		status: 500,
	},
	petalExchangePurchaseInvalid: {
		error: 'localify_petal_exchange_purchase_invalid',
		status: 400,
	},
	petalExchangeRateNotFound: {
		error: 'localify_petal_exchange_rate_not_found',
		status: 500,
	},
	profileDesignCardIdRequired: {
		error: 'localify_profile_design_card_id_required',
		status: 400,
	},
	profileDesignIconIdRequired: {
		error: 'localify_profile_design_icon_id_required',
		status: 400,
	},
	profileNameRequired: {
		error: 'localify_profile_name_required',
		status: 400,
	},
	profileTargetNotFound: {
		error: 'localify_profile_target_not_found',
		status: 404,
	},
	presentBoxItemNotFound: {
		error: 'localify_present_box_item_not_found',
		status: 404,
	},
	playPointInsufficient: {
		error: 'localify_play_point_insufficient',
		status: 400,
	},
	questLiveNotStarted: {
		error: 'localify_quest_live_not_started',
		status: 404,
	},
	questLiveSettingInvalid: {
		error: 'localify_quest_live_setting_invalid',
		status: 400,
	},
	rhythmGameClassMissionInvalid: {
		error: 'localify_rhythm_game_class_mission_invalid',
		status: 400,
	},
	rhythmGameDeckRequired: {
		error: 'localify_rhythm_game_deck_required',
		status: 404,
	},
	rhythmGameNotStarted: {
		error: 'localify_rhythm_game_not_started',
		status: 404,
	},
	sessionMasterReleaseUnavailable: {
		error: 'localify_session_master_release_unavailable',
		status: 500,
	},
	selectTicketExchangeRateIdRequired: {
		error: 'localify_select_ticket_exchange_rate_id_required',
		status: 400,
	},
	selectTicketNotAvailable: {
		error: 'localify_select_ticket_not_available',
		status: 404,
	},
	seasonFanLevelPointStockInsufficient: {
		error: 'localify_season_fan_level_point_stock_insufficient',
		status: 400,
	},
	seasonFanLevelPointStockInvalid: {
		error: 'localify_season_fan_level_point_stock_invalid',
		status: 400,
	},
	siscaPurchaseItemDefinitionNotFound: {
		error: 'localify_sisca_purchase_item_definition_not_found',
		status: 500,
	},
	siscaStoreInvalidPurchase: {
		error: 'localify_sisca_store_invalid_purchase',
		status: 400,
	},
	siscaStoreItemIdRequired: {
		error: 'localify_sisca_store_item_id_required',
		status: 400,
	},
	siscaStoreItemNotAvailable: {
		error: 'localify_sisca_store_item_not_available',
		status: 404,
	},
	siscaStoreSiscaInsufficient: {
		error: 'localify_sisca_store_sisca_insufficient',
		status: 400,
	},
	stickerExchangeInvalid: {
		error: 'localify_sticker_exchange_invalid',
		status: 400,
	},
	stickerExchangeNotFound: {
		error: 'localify_sticker_exchange_not_found',
		status: 404,
	},
	stickerPointInsufficient: {
		error: 'localify_sticker_point_insufficient',
		status: 400,
	},
	userCardNotFound: {
		error: 'localify_user_card_not_found',
		status: 404,
	},
	userCardMasterTemplateNotFound: {
		error: 'localify_user_card_master_template_not_found',
		status: 404,
	},
	userCardEvolutionUnavailable: {
		error: 'localify_user_card_evolution_unavailable',
		status: 400,
	},
	userCardGrowthNotFound: {
		error: 'localify_user_card_growth_not_found',
		status: 500,
	},
	userOwnedEntityIncompatible: {
		error: 'localify_user_owned_entity_incompatible',
		status: 400,
	},
	userCardLimitBreakUnavailable: {
		error: 'localify_user_card_limit_break_unavailable',
		status: 400,
	},
	userItemInsufficient: {
		error: 'localify_user_item_insufficient',
		status: 400,
	},
	userItemNotFound: {
		error: 'localify_user_item_not_found',
		status: 404,
	},
	withliveGiftItemNotFound: {
		error: 'localify_withlive_gift_item_not_found',
		status: 404,
	},
	withstationGiftItemNotFound: {
		error: 'localify_withstation_gift_item_not_found',
		status: 404,
	},
	withstationMessageCardNotFound: {
		error: 'localify_withstation_message_card_not_found',
		status: 404,
	},
	withstationPrizeNotFound: {
		error: 'localify_withstation_prize_not_found',
		status: 404,
	},
};

export function getRouteErrorDefinition(
	code: RouteErrorCode,
): RouteErrorDefinition {
	return routeErrors[code];
}
