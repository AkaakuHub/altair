export type GiftShopLiveKind = 'withlive' | 'withstation';
export type GiftBonusMaster = {
	characterId: number;
	favoriteRank: number;
	order: number;
};
export type GiftShopItemMaster = {
	itemId: number;
	name: string;
	description: string;
	itemType: number;
	rarity: number;
	effectValue: number;
	giftPoint: number;
	maxFavoriteRank: number;
	giftBonusInfo: GiftBonusMaster[];
};
export type GiftItemRow = {
	id: number;
	name: string;
	description: string;
	item_type: number;
	rarity: number;
	effect_value: number;
};
export type MessageCardShopMaster = {
	shopItemId: number;
	itemId: number;
	name: string;
	orderId: number;
	description: string;
	itemType: number;
	itemQuantity: number;
	isPaidSiscaOnly: boolean;
	price: number;
	rarity: number;
	effectValue: number;
	startTime: string;
	endTime: string;
	limitCharactersNum: number;
};
export type MessageCardMaster = {
	itemId: number;
	backgroundColor: string;
	messageTextColor: string;
	messageTextSize: number;
	isMessageTextBold: boolean;
	nameColor: string;
};
