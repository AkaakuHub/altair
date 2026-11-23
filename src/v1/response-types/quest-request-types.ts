export type QuestIdRequest = { quest_id: number };
export type QuestStageIdRequest = { stage_id: number };
export type QuestRecoveryCountRequest = { recovery_count: number };

export type QuestAreaIdRequest = { area_id: number };
export type StandardQuestStageDataRequest = QuestAreaIdRequest &
	QuestStageIdRequest;
export type QuestItemSourceRequest = { items_id: number };

export type QuestLiveSettingRequest = QuestStageIdRequest & {
	quest_live_type: number;
};
export type QuestLiveSettingUpdateRequest = QuestLiveSettingRequest & {
	music_id?: number;
	deck_id?: string;
	is_challenge_mode?: boolean;
	is_rehearsal?: boolean;
};
export type QuestLiveStartRequest = { quest_live_id?: string };
export type QuestLiveFinishRequest = { score?: number; play_report?: string };
