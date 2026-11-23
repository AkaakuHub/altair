import type {
	GachaGuaranteeExchangeRate,
	GachaSelectTicketExchangeRate,
} from '../state/gacha-definition.ts';

export type ExchangePointRateDetailRow = {
	id: number;
	exchange_point_id: number;
	exchange_item_type: number;
	exchange_item_id: number;
	exchange_item_quantity: number;
	exchange_price: number;
	limited_count: number;
	gacha_series_id: number;
};

export type SelectTicketExchangeRateRow = {
	id: number;
	select_ticket_series_id: number;
	exchange_item_type: number;
	exchange_item_id: number;
	exchange_item_quantity: number;
};

export function mapGachaGuaranteeExchangeRate(
	row: ExchangePointRateDetailRow,
): GachaGuaranteeExchangeRate {
	return {
		exchangePointRateId: row.id,
		exchangePointId: row.exchange_point_id,
		gachaSeriesId: row.gacha_series_id,
		exchangeItemType: row.exchange_item_type,
		exchangeItemId: row.exchange_item_id,
		exchangeItemQuantity: row.exchange_item_quantity,
		exchangePrice: row.exchange_price,
		limitedCount: row.limited_count,
	};
}

export function mapGachaSelectTicketExchangeRate(
	row: SelectTicketExchangeRateRow,
): GachaSelectTicketExchangeRate {
	return {
		selectTicketExchangeRateId: row.id,
		selectTicketSeriesId: row.select_ticket_series_id,
		exchangeItemType: row.exchange_item_type,
		exchangeItemId: row.exchange_item_id,
		exchangeItemQuantity: row.exchange_item_quantity,
	};
}
