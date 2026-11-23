export type ArchiveListResponse = ReturnType<
	typeof import('../responses/archive-list-response-service.ts').createArchiveListResponse
>;
type ChapterRankInfoResponse = {
	current_point: number;
	current_rank: number;
	is_max_rank: boolean;
};
type ChapterCategoryPointResponse = {
	category_id: number;
	current_point: number;
	max_point: number;
	is_capped: boolean;
};
export type ChapterHomeResponse = {
	chapter_id: number;
	rank_info: ChapterRankInfoResponse;
	category_list: ChapterCategoryPointResponse[];
};
export type ChapterPointRewardsResponse<TPointReward> = {
	point_reward: Array<TPointReward & { status: number }>;
};
export type ChapterCategoryInfoResponse<TMission> = {
	category_info: ChapterCategoryPointResponse;
	mission_list: TMission[];
};
type LoginBonusRewardResponse = {
	amount: number;
	name: string;
	reward_id: number;
	reward_type: number;
};
type LoginBonusDataResponse = {
	count: number;
	file_name: string;
	is_get: boolean;
	is_now_get: boolean;
	rewards: LoginBonusRewardResponse[];
};
export type LoginBonusEntryResponse = {
	datas: LoginBonusDataResponse[];
	end_time: string;
	file_name: string;
	login_bonus_id: number;
	name: string;
	show_order: number;
	start_time: string;
};
export type LoginBonusResponse = {
	event_login_bonus_list: LoginBonusEntryResponse[];
	login_bonus_list: LoginBonusEntryResponse[];
};
