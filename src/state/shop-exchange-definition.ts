export type ShopExchangeMaster = {
	isConvertibleLimitBreakMaterial: boolean;
	shopList: ShopMaster[];
	gpPrizeExchangeList: GpPrizeExchangeMaster[];
	gpPrizeUserTicketList: GpPrizeUserTicketMaster[];
	itemExchangeList: ItemExchangeMaster[];
	stickerExchangeList: StickerExchangeMaster[];
};

export type ShopMaster = {
	shopType: number;
	name: string;
	orderId: number;
	isExistProducts: boolean;
};

export type GpPrizeExchangeMaster = {
	gpPrizeExchangesId: number;
	productItemType?: number;
	productItemId?: number;
	productItemNum?: number;
	materialItemId?: number;
	materialItemNum?: number;
};

export type GpPrizeUserTicketMaster = {
	itemId: number;
};

export type ItemExchangeMaster = {
	itemExchangesId: number;
	categoryListId?: number;
	productItemId?: number;
	productItemNum?: number;
	materialItemId?: number;
	materialItemNum?: number;
};

export type StickerExchangeMaster = {
	stickerExchangesId: number;
	productStickerId?: number;
	productStickerNum?: number;
	materialItemId?: number;
	materialItemNum?: number;
};
