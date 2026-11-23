export type GachaGuaranteeExchangeItemState = {
	exchangePointRateId: number;
	isHaving: boolean;
	remainingExchangeNum: number;
};
export type GachaExchangeCardState = {
	cardDatasId: number;
	cardName: string;
	cardRarity: string;
};
export type GachaReceiptItemState = {
	get_id: number;
	get_item_type: number;
	get_num: number;
	is_new: boolean;
};
