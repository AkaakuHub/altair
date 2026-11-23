import type { JsonRecord } from './types.ts';

export type GradeChallengeGetQuestListRequest = {
	grade_chal_season_id: number;
};

export type GradeChallengeGetQuestListResponse = {
	stage_list: GradeChallengeStageInfo[];
	received_total_score_rewards_id: number;
	season_grade_point: number;
	is_update_grade_live: boolean;
};

export type GradeChallengeStageInfo = {
	quest_stage_id: number;
	high_score: number;
	reward_list: GradeChallengeStageRewardInfo[];
	music_list: JsonRecord[];
};

export type GradeChallengeStageRewardInfo = {
	grade_chal_quest_stages_rewards_id: number;
	is_received: boolean;
};

export type GradeChallengeGetRankingListRequest = {
	grade_chal_season_id: number;
	grade_chal_quest_stages_id: number | null;
};

export type GradeChallengeGetRankingListResponse = {
	rankings: GradeChallengeRanking[];
};

export type GradeChallengeRanking = {
	player_id: string;
	name: string;
	user_type: number;
	profile_icon_parts_info: string;
	rank: number;
	high_score: number;
	is_mute_player: boolean;
	play_report: string;
};

export type GradeChallengeGetResultRequest = {
	quest_live_id: string;
};

export type GradeChallengeGetResultResponse = {
	quest_live_type: number;
	quest_stage_id: number;
	quest_result: boolean;
	result_love: number;
	add_high_score: number;
	total_high_score: number;
	add_grade_point: number;
	season_grade_point: number;
	reward_list: GradeChallengeStageRewardInfo[];
	play_report: string;
	grade_up_data: GradeUpData;
};

type GradeUpData = {
	before_grade_num: number;
	after_grade_num: number;
};
