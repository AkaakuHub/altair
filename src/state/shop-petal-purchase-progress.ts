import type { EntityProvenance } from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';
import type { UserShopExchangeState } from './shop-exchange-types.ts';

export function addPetalExchangePurchase(
	exchange: UserShopExchangeState,
	cardSeriesId: number,
	num: number,
	provenance: EntityProvenance,
): boolean {
	if (num <= 0) return false;
	const existing = findCompatibleMasterBoundProgress(
		exchange.petalExchangePurchaseList,
		(purchase) => purchase.cardSeriesId === cardSeriesId,
		provenance.identityFingerprint,
	);
	if (existing?.identityFingerprint !== undefined) {
		existing.totalNum += num;
		return true;
	}
	exchange.petalExchangePurchaseList = [
		...exchange.petalExchangePurchaseList,
		{ ...provenance, cardSeriesId, totalNum: (existing?.totalNum ?? 0) + num },
	];
	return true;
}
export function getPetalExchangePurchaseTotal(
	exchange: UserShopExchangeState,
	cardSeriesId: number,
	fingerprint: EntityProvenance['identityFingerprint'],
): number {
	return (
		findCompatibleMasterBoundProgress(
			exchange.petalExchangePurchaseList,
			(purchase) => purchase.cardSeriesId === cardSeriesId,
			fingerprint,
		)?.totalNum ?? 0
	);
}
