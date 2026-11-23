import type { UserStaminaResponse } from './common-response-types.ts';
import type {
	QuestMusicInfoResponse,
	QuestStageListEntryResponse,
} from './quest-common-response-types.ts';
export type StandardQuestStageSelectResponse = {
	stage_list: QuestStageListEntryResponse[];
	user_stamina: UserStaminaResponse;
	is_update_grade_live: boolean;
};
export type StandardQuestStageDetailResponse = {
	stage_id: number;
	is_challenge: boolean;
	is_skip: boolean;
	clear_status: number;
	best_love_music_id: number;
	stage_reward_list: [];
	stage_challenge_reward_list: null;
	best_love: number;
};
export type StandardQuestStageDataResponse = {
	view_stage_id: number;
	stage_detail_list: StandardQuestStageDetailResponse[];
	user_stamina: UserStaminaResponse;
	music_list: QuestMusicInfoResponse[];
};
export type QuestClearStatus = {
	stages_id: number;
	quest_live_type: number;
	is_lock: boolean;
	star_num: number;
};
export type QuestClearStatusListResponse = {
	quest_clear_status_list: QuestClearStatus[];
};
