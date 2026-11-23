import type { EntityProvenance } from './entity-provenance.ts';

export type UserShopExchangeState = {
	playerId: string;
	shopList: UserShopState[];
	petalExchangePurchaseList: UserPetalExchangePurchaseState[];
	gpPrizeExchangeList: UserGpPrizeExchangeState[];
	itemExchangeList: UserItemExchangeState[];
};
export type UserShopState = { shopType: number; isMaintenance: boolean };
export type UserGpPrizeExchangeState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityProvenance['identityFingerprint'];
	gpPrizeExchangesId: number;
	isHaving: boolean;
	remainingExchangeNum: number;
};
export type UserItemExchangeState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityProvenance['identityFingerprint'];
	itemExchangesId: number;
	isLock: boolean;
	remainingExchangeNum: number;
};
export type UserPetalExchangePurchaseState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityProvenance['identityFingerprint'];
	cardSeriesId: number;
	totalNum: number;
};
