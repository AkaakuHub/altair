type ShopListItemResponse = {
	is_exist_products: boolean;
	is_maintenance: boolean;
	name: string;
	order_id: number;
	shop_type: number;
};
export type ShopListResponse = {
	is_convertible_limit_break_material: boolean;
	shop_list: ShopListItemResponse[];
};
type ItemStoreDataResponse = {
	item_type: number;
	item_id: number;
	num: number;
	view_type: number;
	select_ticket_series_id: number | null;
};
type ItemStoreResponse = {
	item_store_id: number;
	name: string;
	description: string;
	product_id: string;
	tier: number;
	price: number;
	limit_num: number;
	buyable_num: number;
	start_time: string;
	end_time: string;
	new_flag: boolean;
	is_visible_end_time: boolean;
	item_list: ItemStoreDataResponse[];
};
export type ItemStoreGetListResponse = {
	bundle_id: string;
	item_store_list: ItemStoreResponse[];
};
type MembershipListInfoResponse = {
	memberships_id: number;
	name: string;
	description: string;
	bundle_id: string;
	product_id: string;
	tier: number;
	price: number;
	start_time: string;
	end_time: string;
	update_count: number;
	expire_time: string | null;
	contract_state: number;
};
export type JewelShopGetMembershipListResponse = {
	bundle_id: string;
	membership_list: MembershipListInfoResponse[];
};
export type PetalExchangeEntryResponse = {
	card_datas_id: number;
	card_series_id: number;
	item_num: number;
	limit_break_times: number;
	total_num: number;
};
export type CharacterPetalExchangeResponse = {
	character_id: number;
	limit_break_exchange_list: PetalExchangeEntryResponse[];
};
export type PetalExchangeListResponse = {
	character_petal_exchange_list: CharacterPetalExchangeResponse[];
	petal_coin_num: number;
};
type GpPrizeExchangeResponse = {
	gp_prize_exchanges_id: number;
	is_having: boolean;
	remaining_exchange_num: number;
};
type GpPrizeUserTicketResponse = { item_id: number; user_num: number };
export type GpPrizeExchangeListResponse = {
	gp_prize_exchange_list: GpPrizeExchangeResponse[];
	user_ticket_list: GpPrizeUserTicketResponse[];
};
type ItemExchangeResponse = {
	is_lock: boolean;
	item_exchanges_id: number;
	remaining_exchange_num: number;
	user_material_item_num: number;
	user_product_item_num: number;
};
export type ItemExchangeListResponse = {
	is_convertible_limit_break_material: boolean;
	item_exchange_list: ItemExchangeResponse[];
};
type StickerExchangeResponse = {
	is_having: boolean;
	sticker_exchanges_id: number;
};
export type StickerExchangeListResponse = {
	sticker_exchange_list: StickerExchangeResponse[];
	sticker_point_num: number;
};
type SiscaStoreItemResponse = {
	buyable_num: number;
	is_new_item: boolean;
	is_sale: boolean;
	own_num: number;
	sisca_store_datas_id: number;
};
export type SiscaStoreListResponse = { item_list: SiscaStoreItemResponse[] };
type SiscaInfoResponse = { free: number; paid: number };
type UserItemInfoResponse = {
	item_id: number;
	item_num: number;
	limit_date_time: string | null;
	user_item_id: string;
};
type UserItemResponse = {
	item_id: number;
	item_num: number;
	item_type: number;
	limit_date_time: string | null;
	rarity: number;
	resource_file_name: string;
	user_item_id: string;
};
type UserItemCategoryResponse = {
	item_category: number;
	user_item_list: UserItemResponse[];
};
export type UserItemsResponse = {
	item_category_list: UserItemCategoryResponse[];
};
export type ItemDetailTemplateResponse = {
	d_item_datas_id: string;
	description: string;
	item_num: number;
	item_type: number;
	limit_date_time: null;
	name: string;
	quest_list: [];
	resource_file_name: string;
	transition_scene: string;
};
export type UserItemDetailResponse = Omit<
	ItemDetailTemplateResponse,
	'limit_date_time'
> & {
	d_item_datas_id: string;
	item_num: number;
	item_type: number;
	limit_date_time: string | null;
	rarity: number;
	resource_file_name: string;
	user_item_id: string;
};
export type SiscaStorePurchaseResponse = {
	sisca_info: SiscaInfoResponse;
	user_item_info: UserItemInfoResponse;
};

export type LimitBreakMaterialConvertListResponse = {
	convert_limit_break_material_list: Array<{
		limit_break_material_num: number;
		rarity: number;
	}>;
};

export type GpPrizeExchangePurchaseResponse = {
	gp_prize_ticket_id: number;
	user_ticket_num: number;
};
export type ItemExchangePurchaseResponse = {
	user_material_item_num: number;
	user_product_item_num: number;
};
export type StickerExchangePurchaseResponse = { sticker_point_num: number };
