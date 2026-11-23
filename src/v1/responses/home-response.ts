import type { ProfileInfo } from './profile-response.ts';

export type HomePlan = {
	name: string;
	priority: number;
	link: string;
	icon_image_asset_bundle: string;
	icon_image_resource_file_name: string;
	bg_image_asset_bundle: string;
	bg_image_resource_file_name: string;
	thumbnail_image_url: string;
	start_time: string;
	end_time: string;
	color_code: string;
};

export type HomeQuestQuitInfo = {
	quest_live_type: number;
	use_type: number;
	return_resource: number;
};

export type HomeItemExchangeNewArrival = {
	category_list_id: number;
	is_not_read_new_arrival: boolean;
};

export type HomeHighlightedBadgeInfo = {
	is_not_watched_adv_from_current_season: boolean;
	is_not_displayed_adv_new_part: boolean;
	has_daily_ticket: boolean;
	has_grand_prix_playable_count: boolean;
	latest_news_id: string;
	feslive_next_start_time: string | null;
	feslive_next_end_time: string | null;
	withlive_next_start_time: string | null;
	withlive_next_end_time: string | null;
	is_not_watched_quest_live_from_current_season: boolean;
	is_not_received_grade_reward: boolean;
	is_update_grade_live: boolean;
	is_not_read_gp_prize_exchange_new_arrival: boolean;
	is_not_read_item_exchange_new_arrival: boolean;
	item_exchange_new_arrival_list: HomeItemExchangeNewArrival[];
	is_available_convert_limit_break_material: boolean;
	is_not_read_on_sale_select_ticket_exchange_new_arrival: boolean;
	is_not_read_out_sale_select_ticket_exchange_new_arrival: boolean;
	is_not_received_common_mission_reward: boolean;
	is_not_read_sticker_exchange_new_arrival: boolean;
	is_not_read_sisca_store_new_arrival: boolean;
};

export type HomeGetHomeResponse = {
	plan_list: HomePlan[];
	is_login_bonus: boolean;
	profile_info: ProfileInfo;
	is_finish_tutorial: boolean;
	is_first_home: boolean;
	membership_update_confirm_list: string[];
	membership_pending_list: string[];
	quest_quit_info: HomeQuestQuitInfo | null;
	finished_simple_tutorial_list: number[];
	beginner_mission_status: 0 | 1 | 2;
	is_not_watched_adv_from_current_season: boolean;
	has_daily_ticket: boolean;
	has_grand_prix_playable_count: boolean;
	latest_news_id: string;
	highlighted_badge_info: HomeHighlightedBadgeInfo;
	expired_limited_gacha_ticket_id_confirm_list: number[];
	standard_quest_areas_id: number;
	standard_quest_stages_id: number;
};
