import type { GachaHistoryEntryState } from '../../state/gacha-types.ts';
import type { JsonObject } from '../../state/json-state-utils.ts';

export type GachaSeriesResponse = {
	gacha_series_id: number;
	card_list: number[];
	is_single_enable: boolean;
	is_consective_enable: boolean;
	is_paid_enable: boolean;
	user_single_ticket_num: number;
	user_consective_ticket_num: number;
	single_campaign_id: number;
	consective_campaign_id: number;
	remaining_single_campaign_count: number;
	remaining_consective_campaign_count: number;
	remaining_limited_gacha_count: number;
	remaining_limited_consective_gacha_count: number;
	remaining_limited_paid_gacha_count: number;
	remaining_rotation_count: number;
	received_gacha_prize_list: [];
	user_exchange_point_num: number;
	user_series_exec_count: number;
	time_limit_gacha_end_time: string | null;
};
export type SelectTicketSeriesResponse = {
	select_ticket_series_id: number;
	user_exchange_ticket_num: number;
	is_sale_select_ticket: boolean;
};
export type GachaSeriesListResponse = {
	convert_exchange_point_list: [];
	expired_limited_gacha_ticket_id_confirm_list: [];
	gacha_series_list: GachaSeriesResponse[];
	select_ticket_series_list: SelectTicketSeriesResponse[];
};
export type GachaHistoryResponse = {
	gacha_result_history_list: GachaHistoryEntryState[];
};
type GachaGuaranteePointResponse = {
	exchange_point_id: number;
	user_guarantee_point_num_before: number;
	user_guarantee_point_num_after: number;
};
export type GachaPurchaseResponse = {
	gacha_result_list: JsonObject[];
	gacha_guarantee_point: GachaGuaranteePointResponse;
	gacha_bonus_result_list: JsonObject[];
	user_single_ticket_num: number;
	user_consective_ticket_num: number;
	gacha_campaign_info_list: [];
	gacha_series_list: GachaSeriesResponse[];
};
type GachaGuaranteePointExchangeItemResponse = {
	exchange_point_rate_id: number;
	is_having: boolean;
	remaining_exchange_num: number;
};
export type GachaGuaranteePointListResponse = {
	exchange_item_list: GachaGuaranteePointExchangeItemResponse[];
};
type SelectTicketExchangeResponse = {
	select_ticket_series_id: number;
	user_select_ticket_num: number;
};
export type SelectTicketExchangeListResponse = {
	select_ticket_exchange_list: SelectTicketExchangeResponse[];
};
type GachaExchangeCardHavingResponse = {
	card_datas_id: number;
	card_name: string;
	card_rarity: string;
	is_having: boolean;
};
export type GachaExchangeCardHavingListResponse = {
	exchange_card_list: GachaExchangeCardHavingResponse[];
};
type SelectTicketExchangeReceiptItem = {
	get_id: number;
	get_item_type: number;
	get_num: number;
	is_new: boolean;
};
export type GachaGuaranteePointExchangeResponse = {
	receipt_items: SelectTicketExchangeReceiptItem[];
};
export type SelectTicketExchangeReceiptResponse = {
	receipt_items: SelectTicketExchangeReceiptItem[];
};
