export type CircleRankingInfoResponse = {
	name: string;
	rank: number;
	month: number;
	point: number;
	member_ranking_list: CircleMemberRankingResponse[] | null;
};
export type CircleMemberRankingResponse = {
	player_id: string;
	player_name: string;
	user_type: number;
	profile_icon_parts_info: string;
	rank: number;
	point: number;
	is_mute_player: boolean;
};
export type CircleInfoResponse = {
	search_guild_key: string;
	guild_id: string;
	guild_name: string;
	leader_player_id: string;
	guild_rank: number;
	guild_policy_action: number;
	guild_policy_recruiting: number;
	guild_comment: string;
	guild_member_num: number;
	guild_icon_parts_info: string;
	d_chat_rooms_id: string;
	feslive_rank_message: string;
	d_guild_invitations_id: string;
	circle_invitations_id: string;
	circle_ranking_info: CircleRankingInfoResponse;
	is_join_guild_ranking: boolean;
};
export type CircleMemberResponse = {
	player_id: string;
	player_name: string;
	player_level: number;
	user_type: number;
	position_type: number;
	profile_card_parts_info: string;
	profile_icon_parts_info: string;
	is_mute_player: boolean;
	is_voice_chat_ban: boolean;
	last_login_date_time: string;
};
export type CircleTopInfoResponse = {
	circle_info: CircleInfoResponse;
	circle_member_list: CircleMemberResponse[];
	circle_ranking_info: CircleRankingInfoResponse;
	emoji_list: [];
	item_request_result: { item_id: number; num: number };
	membership_list: [];
};
export type CircleListItemResponse = CircleInfoResponse;
export type CircleListResponse = {
	circle_info_list: CircleListItemResponse[];
	page_num: number;
	total_page: number;
};
export type CircleDetailResponse = {
	circle_info: CircleInfoResponse;
	circle_member_list: CircleMemberResponse[];
	circle_ranking_info: CircleRankingInfoResponse;
};
export type CircleGetInfoResponse = { circle_info: CircleInfoResponse };
export type CircleJoinInfoResponse = {
	create_time: string;
	d_guild_invitations_id: string;
	is_mute_player: boolean;
	last_login_date_time: string;
	player_id: string;
	player_level: number;
	player_name: string;
	profile_card_parts_info: string;
	profile_icon_parts_info: string;
	user_type: number;
};
export type CircleInviteAndJoinInfoResponse = {
	invite_info_list: [];
	join_info_list: CircleJoinInfoResponse[];
};
export type CircleChatLogResponse = {
	d_chat_datas_id: string;
	chat_type: number;
	player_id: string;
	comment: string;
	order_id: number;
	create_time: string | null;
};
export type CircleCommenterResponse = {
	player_id: string;
	player_name: string;
	profile_icon_parts_info: string;
	user_type: number;
	is_mute_player: boolean;
};
export type CircleChatLogListResponse = {
	circle_chat_log_list: CircleChatLogResponse[];
	commenter_info_list: CircleCommenterResponse[];
	latest_chat_order_id: number;
	polling_interval: number;
};
export type CircleSetChatMessageResponse = { chat_comment: string };
export type CircleInviteListResponse = { invitations_list: [] };
