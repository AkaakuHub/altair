export type GachaGuaranteeExchangeRate = {
	exchangePointRateId: number;
	exchangePointId: number;
	gachaSeriesId: number;
	exchangeItemType: number;
	exchangeItemId: number;
	exchangeItemQuantity: number;
	exchangePrice: number;
	limitedCount: number;
};

export type GachaSelectTicketExchangeRate = {
	selectTicketExchangeRateId: number;
	selectTicketSeriesId: number;
	exchangeItemType: number;
	exchangeItemId: number;
	exchangeItemQuantity: number;
};

export type GachaDrawRate = {
	rateIndex: number;
	minDrawCount: number;
	maxDrawCount: number;
	isGiftless: boolean;
	cardList: GachaDrawCard[];
	bonusItemList: GachaDrawBonusItem[];
};

export type GachaDrawCard = {
	cardDatasId: number;
	odds: number;
};

export type GachaDrawBonusItem = {
	rank: number;
	itemId: number;
	quantity: number;
	odds: number;
};

export type DuplicateCardReward = {
	coinNum: number;
	materialLimitBreakItemId: number;
	materialLimitBreakNum: number;
};

export type DuplicateCardRewardResolver = (
	cardDatasId: number,
) => DuplicateCardReward | undefined;
