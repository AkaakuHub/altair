export type UserItemAvailabilityResponse = {
	item_id: number;
	own_num: number;
};

export type RequiredItemResponse = {
	cost_item_id1: number;
	cost_num1: number;
	cost_item_id2: number;
	cost_num2: number;
	cost_item_id3: number;
	cost_num3: number;
};

export type StyleLevelUpCheckResponse = {
	is_possible: boolean;
	current_style_level: number;
	selectable_max_level: number;
	style_point: number;
};

export type EvolutionCheckResponse = {
	is_possible: boolean;
	user_item_list: UserItemAvailabilityResponse[];
	required_item_list: RequiredItemResponse[];
	next_max_style_level: number;
};

export type LimitBreakCheckResponse = {
	is_possible: boolean;
	current_limit_break_times: number;
	selectable_limit_break_times: number;
	user_item_list: UserItemAvailabilityResponse[];
	required_item_list: RequiredItemResponse[];
};

export type SkillLevelUpCheckResponse = {
	is_possible: boolean;
	current_skill_level: number;
	selectable_max_level: number;
	user_item_list: UserItemAvailabilityResponse[];
	required_item_list: RequiredItemResponse[];
};

export type CardGrowthMutationResponse = { result: true };
