export type ItemExchangeListRequest = { category_list_id?: number };
export type UserItemDetailRequest = { d_item_datas_id: string };

export type PetalExchangePurchaseRequest = {
	card_series_id: number;
	num: number;
};
export type GpPrizeExchangePurchaseRequest = { gp_prize_exchanges_id: number };
export type ItemExchangePurchaseRequest = {
	item_exchanges_id: number;
	num: number;
};
export type StickerExchangePurchaseRequest = { sticker_exchanges_id: number };
export type SiscaStorePurchaseRequest = {
	sisca_store_datas_id: number;
	purchase_num?: number;
};
