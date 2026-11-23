import type { receiveBeginnerMissionRewards } from '../../state/beginner-mission-reward-state.ts';
export type MissionRewardResponse = {
	item_id: number;
	item_type: number;
	reward_num: number;
	reward_type: number;
};
type BeginnerMissionResponse = {
	achieved_num: number;
	mission_id: number;
	status: number;
};
type BeginnerMissionCategoryResponse = {
	is_received: boolean;
	mission_list: BeginnerMissionResponse[];
	mission_type: number;
};
export type BeginnerMissionListResponse = {
	mission_category_list: BeginnerMissionCategoryResponse[];
};
type CommonMissionInfoResponse = {
	received_order: number;
	rhythm_game_star: number;
	school_stage_star: number;
};
type MissionAchieveRewardResponse = {
	achieved_num: number;
	is_achieved: boolean;
	reward_list: MissionRewardResponse[];
	target_num: number;
};
type MissionResponse = {
	achieved_num: number;
	condition_achieve_num: number;
	description: string;
	is_achieved: boolean;
	mission_id: number;
	name: string;
	reward_list: MissionRewardResponse[];
	transition_contents_id: number;
};
type MissionGroupResponse = {
	achieve_reward_list: MissionAchieveRewardResponse[];
	end_date: string | null;
	mission_type: number;
	mission_list: MissionResponse[];
	start_date: string | null;
};
export type MissionListResponse = {
	common_mission_info: CommonMissionInfoResponse;
	mission_list: MissionGroupResponse[];
};

export type BeginnerMissionRewardAllResponse = NonNullable<
	ReturnType<typeof receiveBeginnerMissionRewards>
>;
export type CommonMissionRewardResponse = {
	received_common_mission_ids: number[];
};
