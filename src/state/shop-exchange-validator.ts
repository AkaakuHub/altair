import { isArrayOf, isRecord } from './json-state-utils.ts';
import type {
	UserGpPrizeExchangeState,
	UserItemExchangeState,
	UserPetalExchangePurchaseState,
	UserShopExchangeState,
	UserShopState,
} from './shop-exchange-types.ts';

export function isUserShopExchangeState(
	value: unknown,
): value is UserShopExchangeState {
	if (!isRecord(value)) return false;
	return (
		typeof value.playerId === 'string' &&
		isArrayOf(value.shopList, isShop) &&
		(value.petalExchangePurchaseList === undefined ||
			isArrayOf(value.petalExchangePurchaseList, isPetal)) &&
		isArrayOf(value.gpPrizeExchangeList, isGp) &&
		isArrayOf(value.itemExchangeList, isItem)
	);
}

const provenance = (value: Record<string, unknown>) =>
	(value.sourceMasterReleaseId === undefined ||
		typeof value.sourceMasterReleaseId === 'string') &&
	(value.identityFingerprint === undefined ||
		(isRecord(value.identityFingerprint) &&
			typeof value.identityFingerprint.domain === 'string' &&
			typeof value.identityFingerprint.value === 'string'));
const isShop = (value: unknown): value is UserShopState =>
	isRecord(value) &&
	typeof value.shopType === 'number' &&
	typeof value.isMaintenance === 'boolean';
const isPetal = (value: unknown): value is UserPetalExchangePurchaseState =>
	isRecord(value) &&
	provenance(value) &&
	typeof value.cardSeriesId === 'number' &&
	typeof value.totalNum === 'number';
const isGp = (value: unknown): value is UserGpPrizeExchangeState =>
	isRecord(value) &&
	provenance(value) &&
	typeof value.gpPrizeExchangesId === 'number' &&
	typeof value.isHaving === 'boolean' &&
	typeof value.remainingExchangeNum === 'number';
const isItem = (value: unknown): value is UserItemExchangeState =>
	isRecord(value) &&
	provenance(value) &&
	typeof value.itemExchangesId === 'number' &&
	typeof value.isLock === 'boolean' &&
	typeof value.remainingExchangeNum === 'number';
