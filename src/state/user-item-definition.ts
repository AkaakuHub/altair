import type { EntityIdentityFingerprint } from './entity-provenance.ts';

export type UserItemDefinition = {
	itemId: number;
	itemType: number;
	itemCategory: number;
	rarity: number;
	resourceFileName: string;
	limitDateTime: string | null;
};
export type UserItemState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	userItemId: string;
	itemId: number;
	itemNum: number;
	itemType: number;
	itemCategory?: number;
	pickupTime?: string;
	limitDateTime: string | null;
	rarity: number;
	resourceFileName: string;
};
export type UserItemCategoryState = {
	itemCategory: number;
	userItemList: UserItemState[];
};
export type UserInventoryState = {
	playerId: string;
	itemCategoryList: UserItemCategoryState[];
};
export type UserIconFrameState = { frame_id: number; pickup_time: string };
