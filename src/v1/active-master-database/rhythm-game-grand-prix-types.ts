import type { JsonRecord } from './types.ts';

export type RhythmGameGrandPrixTopRequest = {
	grand_prix_id: number;
};

export type RhythmGameGrandPrixTopResponse = JsonRecord & {
	series_list: RhythmGameGrandPrixSeriesResponse[];
	ranking: number;
	ranking_score: number;
	rank_display_type: number;
	daily_total_grand_prix_point: number;
	personal_ranking_info: RhythmGameGrandPrixPersonalInfoResponse;
	circle_ranking_info: RhythmGameGrandPrixCircleInfoResponse;
	status: number;
	predicated_ranking_score_info: GrandPrixRankingScoreInfoResponse;
	get_points: [];
};

export type RhythmGameGrandPrixSetDeckRequest = {
	grand_prix_rhythm_game_series_id: number;
	deck_card_list: RhythmGameGrandPrixSetDeckDataRequest[];
};

export type RhythmGameGrandPrixSetDeckDataRequest = {
	slot_no: number;
	d_card_datas_id: string;
	is_center: boolean;
};

export type RhythmGameGrandPrixSetCenterRequest = {
	grand_prix_rhythm_game_series_id: number;
	slot_no: number;
};

export type RhythmGameGrandPrixSetPositionRequest = {
	grand_prix_rhythm_game_series_id: number;
	deck_card_list: RhythmGameGrandPrixSetPositionDataRequest[];
};

export type RhythmGameGrandPrixSetPositionDataRequest = {
	series_deck_card_datas_id: string;
	slot_no: number;
};

export type RhythmGameGrandPrixSetResetRequest = {
	grand_prix_id: number;
};

export type RhythmGameGrandPrixSetStartLiveRequest = {
	grand_prix_rhythm_game_series_id: number;
	music_id: number;
	music_score_difficulty: number;
	friend_card_player_id: string;
	friend_card_id: string;
};

export type RhythmGameGrandPrixSetFinishLiveRequest = JsonRecord & {
	score: number;
	technical_score: number;
	notes_result_list: JsonRecord[];
	remain_mental: number;
	play_data: JsonRecord;
};

export type RhythmGameGrandPrixSetDeckResponse = JsonRecord & {
	deck_card_list: RhythmGameGrandPrixDeckCardInfoResponse[];
};

export type RhythmGameGrandPrixSetCenterResponse =
	RhythmGameGrandPrixSetDeckResponse;

export type RhythmGameGrandPrixSetPositionResponse =
	RhythmGameGrandPrixSetDeckResponse;

export type RhythmGameGrandPrixSetFinishLiveResponse = JsonRecord & {
	music_score_mission_result: JsonRecord;
	clear_status: number;
	class_mission_progress_list: JsonRecord[];
	rhythm_game_star_total_count: number;
	grand_prix_point_info: GrandPrixPointInfoResponse;
};

export type RhythmGameGrandPrixEmptyResponse = Record<string, never>;

export type RhythmGameGrandPrixSeriesResponse = JsonRecord & {
	grand_prix_rhythm_game_series_id: number;
	deck_card_list: RhythmGameGrandPrixDeckCardInfoResponse[];
	best_score: number;
	current_daily_point: number;
	is_locked: boolean;
	top_used_list: JsonRecord[];
};

export type RhythmGameGrandPrixDeckCardInfoResponse = JsonRecord & {
	series_deck_card_datas_id: string;
	d_card_datas_id: string;
	slot_no: number;
	is_center: boolean;
};

type RhythmGameGrandPrixPersonalInfoResponse = JsonRecord & {
	personal_total_point: number;
	personal_ranking: number;
};

type RhythmGameGrandPrixCircleInfoResponse = JsonRecord & {
	search_guild_key: string;
	guild_name: string;
	guild_total_point: number;
	guild_ranking: number;
	within_guild_ranking: number;
};

type GrandPrixRankingScoreInfoResponse = JsonRecord & {
	ranking_score: number;
	contents_type: number;
};

type GrandPrixPointInfoResponse = JsonRecord & {
	point: number;
	point_bonus_list: JsonRecord[];
	before_point: number;
};
