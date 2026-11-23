import type { FesliveClap } from '../../state/feslive-clap.ts';
import type { JsonObject } from '../../state/json-state-utils.ts';

export type EmptyLiveBroadcastRequest = Record<string, never>;
export type EmptyLiveBroadcastResponse = JsonObject;

export type LiveConnectTokenRequest = {
	live_id: string;
};

export type LiveConnectTokenResponse = {
	operator_token: string;
	audience_token: string;
};

export type FesliveInfo = {
	live_id: string;
	feslives_no: number;
	name: string;
	status: number;
	open_time: string;
	scheduled_start_time: string;
	start_time: string;
	extra_start_time: string;
	end_time: string;
	close_time: string;
	streaming_type: number;
};

export type FesliveGetListResponse = {
	feslive_info: FesliveInfo[];
};

export type WithliveInfo = {
	live_id: string;
	withlives_no: number;
	name: string;
	status: number;
	open_time: string;
	scheduled_start_time: string;
	start_time: string;
	extra_start_time: string;
	end_time: string;
	close_time: string;
};

export type WithliveGetListResponse = {
	withlive_info: WithliveInfo[];
};

export type FesliveEnterRequest = {
	live_id: string;
};

export type FesliveEnterResponse = {
	timelines: JsonObject[];
	circle_chats: JsonObject[];
	room: JsonObject;
	announcements: JsonObject[];
	live_location_id: number;
	costume_ids: number[];
	timeline_ids: number[];
	content_code: number;
	clap_info: FesliveClap;
	penlight_colors: JsonObject[];
	characters: JsonObject[];
	viewer_count: number;
	user_gift_pt: number;
	name: string;
	description: string;
	max_season_fan_level: number;
	camera_focus_character_id: number;
	selectable_camera_types: number[];
	current_camera_type: number;
	ticket_rank: number;
	is_belong_circle: boolean;
	is_exhibition: boolean;
	has_extra: boolean;
	scheduled_start_time: string;
	emoji_list: number[];
	membership_list: number[];
	hls?: JsonObject | undefined;
	user_profile: JsonObject;
};

export type WithliveEnterRequest = {
	live_id: string;
};

export type WithliveEnterResponse = {
	timelines: JsonObject[];
	room: JsonObject;
	live_location_id: number;
	costume_ids: number[];
	timeline_ids: number[];
	content_code: number;
	user_gift_pt: number;
	total_gift_pt: string;
	viewer_count: number;
	scheduled_start_time: string;
	is_live: boolean;
	is_horizontal: boolean;
	characters: JsonObject[];
	max_season_fan_level: number;
	door_status: number;
	has_extra: boolean;
	gift_star_reward_segments: number[];
	gift_stars_threshold_for_extra_admission: number;
	has_admission: boolean;
	has_extra_admission: boolean;
	name: string;
	description: string;
	cover_image_url: string;
	is_belong_circle: boolean;
	bgmCueName: string;
	bgmAcbPath: string;
	emoji_list: number[];
	membership_list: number[];
	hls?: JsonObject | undefined;
	enquetes: JsonObject[];
	latest_enquete_id: string | null;
	user_profile: JsonObject;
};

export type FesliveGetGiftShopListRequest = {
	m_feslives_id: string;
};

export type FesliveGetGiftShopListResponse = {
	gift_shop_item_info: JsonObject[];
	message_card_shop_info: JsonObject[];
	gift_box_borders: number[];
};

export type LiveIdQueryRequest = {
	live_id: string;
};

export type LivePrizeQueryRequest =
	| { live_id: string; present_box_id?: string }
	| { live_id?: string; present_box_id: string };

export type FesliveLiveInfoRequest = LiveIdQueryRequest & {
	offset_timeline_id?: string;
	offset_circle_chat_id?: string;
};

export type FesliveLiveInfoResponse = {
	timelines: JsonObject[];
	circle_chats: JsonObject[];
	has_admission: boolean;
	door_status: number;
	penlight_colors: JsonObject[];
	clap: FesliveClap;
	polling_interval: number;
	is_trouble: boolean;
};

export type FesliveLiveSubinfoResponse = {
	viewer_count: number;
	circle_members: JsonObject[];
	polling_interval: number;
};

export type FesliveLobbyRequest = {
	live_id: string;
};

export type FesliveLobbyResponse = {
	timelines: JsonObject[];
	circle_chats: JsonObject[];
	flower_stands: JsonObject[];
	announcements: JsonObject[];
	live_location_id: number;
	costume_ids: number[];
	timeline_ids: number[];
	content_code: number;
	circle_info: JsonObject;
	circle_members: JsonObject[];
	scheduled_start_time: string;
	close_time: string;
	characters: JsonObject[];
	door_status: number;
	has_admission: boolean;
	user_gift_pt: number;
	live_grand_prix_info: JsonObject;
	ticket_info: JsonObject;
	name: string;
	description: string;
	max_season_fan_level: number;
	is_belong_circle: boolean;
	is_exhibition: boolean;
	has_extra: boolean;
	has_ticket: boolean;
	is_first_ticket_view: boolean;
	background_image_url: string;
	bgmCueName: string;
	bgmAcbPath: string;
	emoji_list: number[];
	membership_list: number[];
	hls?: JsonObject | undefined;
	streaming_type: number;
	is_scheduled_start_time_visible: boolean;
	user_profile: JsonObject;
};

export type FesliveLobbyInfoRequest = LiveIdQueryRequest & {
	offset_timeline_id?: string;
	offset_circle_chat_id?: string;
};

export type FesliveLobbyInfoResponse = {
	timelines: JsonObject[];
	circle_chats: JsonObject[];
	hall_open_time: string;
	has_admission: boolean;
	door_status: number;
	polling_interval: number;
};

export type FesliveLobbySubinfoResponse = {
	flower_stands: JsonObject[];
	viewer_count: number;
	polling_interval: number;
	circle_members: JsonObject[];
};

export type FesliveLiveAnnouncementResponse = {
	announcement: JsonObject;
	enquete: JsonObject;
	polling_interval: number;
};

export type FesliveLobbyAnnouncementResponse = {
	announcement: JsonObject;
	polling_interval: number;
};

export type GiftPointRankingsResponse = {
	gift_pt_rankings: JsonObject[];
	user_gift_pt: number;
	user_gift_pt_ranking: number;
	user_icon_parts_info: string;
	total_gift_pt: string;
	polling_interval: number;
};

export type FesliveGiftPtRankingsResponse = GiftPointRankingsResponse;
export type WithliveGiftPtRankingsResponse = GiftPointRankingsResponse;

export type FesliveGrandPrixRankingRequest = {
	live_id: string;
	get_rank_type: number;
	target_rank: number;
};

export type FesliveGrandPrixRankingResponse = {
	borders: JsonObject[];
	user_rank: number;
	ranking: JsonObject[];
};

export type FesliveOutQuestLiveRankingRequest = {
	live_id: string;
	get_rank_type: number;
	target_rank: number | null;
};

export type FesliveOutQuestLiveRankingResponse = {
	borders: number[];
	my_rank: number;
	rankings: JsonObject[];
	higher_target_rank: number;
	lower_target_rank: number;
};

export type FeslivePrizeResponse = {
	seat_rank_name: string;
	seat_rank_prizes: JsonObject[];
	mission_prizes: JsonObject[];
	common_prizes: JsonObject[];
	characters: JsonObject[];
	season_id: number;
	is_exhibition: boolean;
	is_display_ranking: boolean;
};

export type WithliveLiveInfoRequest = LiveIdQueryRequest & {
	offset_timeline_id?: string;
};

export type WithliveLiveInfoResponse = {
	timelines: JsonObject[];
	room: JsonObject;
	hall_open_time: string;
	has_admission: boolean;
	has_extra_admission: boolean;
	door_status: number;
	polling_interval: number;
	hls?: JsonObject | undefined;
	active_enquete_id: string | null;
	enquetes: JsonObject[];
	latest_enquete_id: string | null;
	is_trouble: boolean;
};

export type WithliveLiveSubinfoResponse = {
	total_gift_pt: string;
	viewer_count: number;
	polling_interval: number;
};

export type WithlivePrizeResponse = {
	items: JsonObject[];
	user_gift_pt: number;
	star_info: JsonObject;
	characters: JsonObject[];
	season_id: number;
	season_fanlevel_point_stock: number;
	season_fanlevel_point_stock_limit: number;
};

export type WithliveResultRankingRequest = {
	live_id: string;
	get_rank_type: number;
	target_rank: number;
};

export type WithliveResultRankingResponse = {
	borders: JsonObject[];
	user_rank: number;
	ranking: JsonObject[];
};

export type FesliveCommentRequest = {
	live_id: string;
	comment: string;
};

export type FesliveCommentResponse = {
	timeline_id: string;
	name_color: string;
	text_color: string;
	background_color: string;
	comment: string;
};

export type FesliveCircleChatCommentRequest = {
	live_id: string;
	comment: string;
};

export type FesliveCircleChatCommentResponse = {
	circle_chat_id: string;
	name_color: string;
	text_color: string;
	background_color: string;
	comment: string;
};

export type FesliveClapRequest = {
	live_id: string;
	count: number;
};

export type FesliveEnqueteRequest = {
	live_id: string;
	enquete_id: string;
	value: number;
};

export type FeslivePenlightColorRequest = {
	live_id: string;
	before_color_ids: string[];
	after_color_ids: string[];
};

export type FesliveGiftRequest = {
	live_id: string;
	shop_item_id: number;
	user_item_id: string;
	use_own_amount: number;
	purchase_amount: number;
	character_id: number | null;
};

export type WithliveGiftRequest = {
	live_id: string;
	user_item_id: string;
	shop_item_id?: number;
	use_own_amount: number;
	purchase_amount?: number;
	character_id: number | null;
};

export type LiveGiftResponse = {
	timeline_id: string;
	name_color: string;
	text_color: string;
	background_color: string;
	animation: JsonObject;
	user_gift_pt: number;
	total_user_gift_pt: number;
	user_icon_parts_info: string;
	display_user_icon: boolean;
	image_size: number;
};

export type FesliveGiftResponse = LiveGiftResponse;
export type WithliveGiftResponse = LiveGiftResponse;

export type LiveMessageCardRequest = {
	live_id: string;
	shop_item_id: number;
	user_item_id: string;
	message: string;
	character_id: number | null;
};

export type FesliveMessageCardRequest = LiveMessageCardRequest;
export type WithliveMessageCardRequest = LiveMessageCardRequest;

export type LiveMessageCardResponse = {
	timeline_id: string;
	name_color: string;
	text_color: string;
	background_color: string;
	user_gift_pt: number;
	total_user_gift_pt: number;
	message: string;
	text_size: number;
	is_text_bold: boolean;
};

export type FesliveMessageCardResponse = LiveMessageCardResponse;
export type WithliveMessageCardResponse = LiveMessageCardResponse;

export type FesliveSetCameraRequest = {
	live_id: string;
	camera_type: number;
	focus_character_id: number;
};

export type FesliveSetCameraResponse = {
	camera_type: number;
	focus_character_id: number;
};

export type SetFlowerStandRequest = {
	live_id: string;
	flower_stand_type_id: number;
	flower_stand_color1_id: number;
	flower_stand_color2_id: number;
	flower_stand_idol_picture_id: number;
	flower_stand_message: string;
};

export type SetFlowerStandResponse = {
	result: boolean;
};

export type FesliveSetPrizeRequest = {
	live_id?: string | null;
	present_box_id: string;
};

export type WithliveCommentRequest = {
	live_id: string;
	comment: string;
};

export type WithliveCommentResponse = FesliveCommentResponse;

export type WithliveEnqueteAnswerRequest = {
	live_id: string;
	enquete_id: string;
	option_id: string;
};

export type WithliveEnqueteAnswerResponse = {
	status: 0 | 1 | 2 | 3 | 4;
};

export type WithliveSetStarRequest = {
	present_box_id: string;
	/** @examples ["{\"set_star_info_list\":[]}"] */
	set_star_json: string;
};

export type WithliveSetStarResponse = {
	result: boolean;
};
