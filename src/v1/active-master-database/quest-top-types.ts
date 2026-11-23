import type { getStandardAreaSelect } from './quest-top-master-query.ts';

export type QuestTopStatus = 0 | 1;

export type QuestTopGradeDetail = {
	grade_num: number;
	is_not_received_grade_reward: boolean;
	season_grade_id: number;
	season_grade_point: number;
	season_grade_point_rank: number;
	status: QuestTopStatus;
	total_grade_point: number;
	grade_rewards: Array<{ grade_rewards_id: number; reward_status: number }>;
};

export type QuestTopResponse = {
	standard_live_status: QuestTopStatus;
	daily_live_status: QuestTopStatus;
	music_live_status: QuestTopStatus;
	grade_live_status: QuestTopStatus;
	grade_challenge_status: QuestTopStatus;
	grade_challenge_season_id: number;
	grade_challenge_season_start_datetime: string | null;
	grade_challenge_season_end_datetime: string | null;
	grade_detail: QuestTopGradeDetail;
	dream_live_status: QuestTopStatus;
	grand_prix_open: boolean;
	grand_prix_status: QuestTopStatus;
	grand_prix_id: number;
	grand_prix_start_datetime: string;
	grand_prix_end_datetime: string;
	raid_event_status: QuestTopStatus;
	raid_event_id: number;
	raid_event_start_datetime: string | null;
	raid_event_end_datetime: string | null;
	open_campaign_id_list: number[];
	standard_area_select: ReturnType<typeof getStandardAreaSelect>;
};
