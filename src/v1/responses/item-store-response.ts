import type {
	ItemStoreGetListResponse,
	JewelShopGetMembershipListResponse as MembershipListResponse,
} from '../response-types/shop-inventory-response-types.ts';

export function createItemStoreGetListResponse(): ItemStoreGetListResponse {
	return {
		bundle_id: '',
		item_store_list: [],
	};
}

export function hasItemStoreProducts(): boolean {
	return createItemStoreGetListResponse().item_store_list.length > 0;
}

export function createJewelShopGetMembershipListResponse(): MembershipListResponse {
	return {
		bundle_id: '',
		membership_list: [],
	};
}

export function hasMembershipProducts(): boolean {
	return createJewelShopGetMembershipListResponse().membership_list.length > 0;
}
