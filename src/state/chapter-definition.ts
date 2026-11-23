export type ChapterCategoryMaster = {
	categoryId: number;
	maxPoint: number;
	isCapped: boolean;
};

export type ActiveChapterMaster = {
	chapterId: number;
	categoryPoints: ChapterCategoryMaster[];
};

export type ChapterPointReward = {
	chapter_point_rewards_id: number;
	required_point: number;
	status: number;
	reward_datas: ChapterPointRewardData[];
};

export type ChapterPointRewardData = {
	chapter_point_reward_datas_id: number;
	item_type: number;
	item_id: number;
	num: number;
};

export type ChapterMission = {
	mission_id: number;
	name: string;
	achieve_num: number;
	achieved_num: number;
	is_achieved: boolean;
	is_received: boolean;
};

export type ChapterRankMaster = {
	currentRank: number;
	isMaxRank: boolean;
};
