import type { UserDailyTicketInfo } from './app-content-response-types.ts';
import type {
	QuestMusicInfoResponse,
	QuestStageListEntryResponse,
} from './quest-common-response-types.ts';

export type DailyQuestStageListResponse = {
	user_daily_ticket_info: UserDailyTicketInfo;
	stage_list: QuestStageListEntryResponse[];
};
export type DailyQuestStageDataResponse = {
	stage_id: number;
	clear_status: number;
	best_love_music_id: number;
	user_daily_ticket_info: UserDailyTicketInfo;
	stage_reward_list: [];
	best_love: number;
	music_list: QuestMusicInfoResponse[];
};
