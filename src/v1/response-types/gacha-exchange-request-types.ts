export type GachaGuaranteePointListRequest = { gacha_series_id: number };
export type GachaGuaranteePointExchangeRequest = {
	exchange_point_rate_id: number;
};
export type GachaExchangeCardHavingListRequest = {
	exchange_type: number;
	exchange_id: number;
};
export type SelectTicketExchangeRequest = {
	select_ticket_exchange_rate_id: number;
};
