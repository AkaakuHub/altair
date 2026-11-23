import type {
	ActivityRecordMonthlyInfo,
	ActivityRecordWatchReward,
} from '../../master-data/activity-record-master.ts';

export type UserDailyTicketInfo = {
	num: number;
	max: number;
	next_reset_time: string;
};

export type ActivityRecordTopResponse = {
	activity_record_monthly_info_list: ActivityRecordMonthlyInfo[];
};

export type ActivityRecordPlayAdvDataResponse = {
	watch_reward_list: ActivityRecordWatchReward[];
};

export type ActivityRecordAdvRequest = { adv_data_id: number };

export type ActivityRecordSetWatchableStatusResponse = {
	watchable_status: number;
	adv_unlock_item_num: number;
};

export type WithliveGiftShopListResponse = ReturnType<
	typeof import('../route-support/archive-gift-shop.ts').createGiftShopListResponse
>;
export type WebviewThemeListResponse = [];

export type OutQuestLiveDailyStageSelectResponse = {
	temporary_release_daily_quest_series_id_list: number[];
	user_daily_ticket_info: UserDailyTicketInfo;
};

export type RhythmGameReceiveClassMissionRequest = {
	target_condition_type: number;
};

export type RhythmGameClassMissionResponse = {
	condition_type: number;
	progress_num: number;
	received_order: number;
};

export type RhythmGameReceiveClassMissionResponse = {
	received_class_data_ids: number[];
	class_mission_info: RhythmGameClassMissionResponse;
};

export type DailyQuestRecoveryChallengeCountResponse = {
	challenge_count: number;
	recovery_count: number;
	max_recovery_count: number;
	price: number;
};

export type DailyQuestRecoveryResultResponse = { challenge_count: number };

type StepUpBeginnerMissionResponse = {
	achieved_num: number;
	is_achieved: boolean;
	is_received: boolean;
	mission_id: number;
};

export type StepUpBeginnerMissionListResponse = {
	step_up_mission_list: StepUpBeginnerMissionResponse[];
};

export type ContentReleaseEffectResponse = { contents_id: number; status: 1 };
