export type FanLevelInfoResponse = {
	fan_level_info_list: FanLevelInfo[];
	season_id: number;
	season_fanlevel_point_stock: number;
	season_fanlevel_point_stock_limit: number;
};
export type ProfileUseFanLevelPointStocksRequest = {
	use_stock_list: UseFanLevelPointStock[];
};
type UseFanLevelPointStock = { characters_id: number; use_stock: number };
export type ProfileUseFanLevelPointStocksResponse = {
	season_fan_level_info_list: SeasonFanLevelInfo[];
	season_fanlevel_point_stock: number;
	season_fanlevel_point_stock_limit: number;
};
export type SeasonFanLevelInfo = {
	characters_id: number;
	d_season_fan_level: number;
	d_season_fan_experience: number;
	grade: number;
};
export type FanLevelInfo = {
	character_id: number;
	d_season_fan_level: number;
	d_season_fan_experience: number;
	member_fan_level: number;
	member_fan_experience: number;
	earn_progress_list: EarnProgress[];
};
export type EarnProgress = {
	earn_type: number;
	total_point: number;
	season_point_history_list: SeasonPointHistory[];
};
type SeasonPointHistory = {
	season_id: number;
	point_history_list: PointHistory[];
};
type PointHistory = { date: string; message: string; point: number };
export type FanLevelRankingResponse = {
	my_rank: number;
	my_member_fan_level: number;
	rankings: FanLevelRankingEntry[];
};
export type FanLevelRankingEntry = {
	rank: number;
	player_id: string;
	player_name: string;
	profile_icon_parts_info: string;
	member_fan_level: number;
};
