import type { EntityProvenance } from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';
import type {
	UserGpPrizeExchangeState,
	UserShopExchangeState,
} from './shop-exchange-types.ts';

export function findGpPrizeExchangeState(
	exchange: UserShopExchangeState,
	id: number,
	provenance: EntityProvenance,
): UserGpPrizeExchangeState | undefined {
	return findCompatibleMasterBoundProgress(
		exchange.gpPrizeExchangeList,
		(prize) => prize.gpPrizeExchangesId === id,
		provenance.identityFingerprint,
	);
}
export function markGpPrizeExchangePurchased(
	exchange: UserShopExchangeState,
	id: number,
	provenance: EntityProvenance,
): boolean {
	let entry = findGpPrizeExchangeState(exchange, id, provenance);
	if (entry?.identityFingerprint === undefined) {
		entry = {
			...provenance,
			gpPrizeExchangesId: id,
			isHaving: entry?.isHaving ?? false,
			remainingExchangeNum: entry?.remainingExchangeNum ?? 0,
		};
		exchange.gpPrizeExchangeList.push(entry);
	}
	entry.isHaving = true;
	return true;
}
