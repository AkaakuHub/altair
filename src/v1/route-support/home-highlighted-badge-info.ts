import type { Database } from 'bun:sqlite';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import type { HomeActivityRecordBadgeProjection } from '../../state/home-highlighted-badge-projection.ts';
import type { HomeHighlightedBadgeInfo } from '../responses/home-response.ts';
import type { HomeEventSchedule } from './home-content-repositories.ts';
import type { HomeExchangeNotifications } from './home-exchange-notification-repository.ts';
import type { HomePlayableBadgeProjection } from './home-playable-badge-projection.ts';
import { hasAvailableLimitBreakMaterialConvertFromDatabase } from './limit-break-convert-notification-availability.ts';

export function createHomeHighlightedBadgeInfo(
	database: Database,
	state: ServerState,
	user: RegisteredUserState,
	exchangeNotifications: HomeExchangeNotifications,
	playableBadges: HomePlayableBadgeProjection,
	latestNewsId: string,
	eventSchedule: HomeEventSchedule,
	activityRecordBadges: HomeActivityRecordBadgeProjection,
	hasUnreceivedCommonMissionReward: boolean,
): HomeHighlightedBadgeInfo {
	return {
		feslive_next_end_time: eventSchedule.fesLiveNextEndTime,
		feslive_next_start_time: eventSchedule.fesLiveNextStartTime,
		has_daily_ticket: playableBadges.hasDailyTicket,
		has_grand_prix_playable_count: playableBadges.hasGrandPrixPlayableCount,
		is_not_displayed_adv_new_part:
			activityRecordBadges.isNotDisplayedAdvNewPart,
		is_not_read_gp_prize_exchange_new_arrival:
			exchangeNotifications.isNotReadGpPrizeExchangeNewArrival,
		is_not_read_item_exchange_new_arrival:
			exchangeNotifications.isNotReadItemExchangeNewArrival,
		item_exchange_new_arrival_list: [
			...exchangeNotifications.itemExchangeNewArrivalList,
		],
		is_available_convert_limit_break_material:
			hasAvailableLimitBreakMaterialConvertFromDatabase(database, state, user),
		is_not_read_on_sale_select_ticket_exchange_new_arrival:
			exchangeNotifications.isNotReadOnSaleSelectTicketExchangeNewArrival,
		is_not_read_out_sale_select_ticket_exchange_new_arrival:
			exchangeNotifications.isNotReadOutSaleSelectTicketExchangeNewArrival,
		is_not_read_sticker_exchange_new_arrival:
			exchangeNotifications.isNotReadStickerExchangeNewArrival,
		is_not_read_sisca_store_new_arrival:
			exchangeNotifications.isNotReadSiscaStoreNewArrival,
		is_not_received_common_mission_reward: hasUnreceivedCommonMissionReward,
		is_not_received_grade_reward: false,
		is_not_watched_adv_from_current_season:
			activityRecordBadges.isNotWatchedAdvFromCurrentSeason,
		is_not_watched_quest_live_from_current_season: false,
		is_update_grade_live: false,
		latest_news_id: latestNewsId,
		withlive_next_end_time: eventSchedule.withLiveNextEndTime,
		withlive_next_start_time: eventSchedule.withLiveNextStartTime,
	};
}
