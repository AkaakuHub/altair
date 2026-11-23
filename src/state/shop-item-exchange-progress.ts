import type { EntityProvenance } from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';
import type {
	UserItemExchangeState,
	UserShopExchangeState,
} from './shop-exchange-types.ts';

export function findItemExchangeState(
	exchange: UserShopExchangeState,
	id: number,
	provenance: EntityProvenance,
): UserItemExchangeState | undefined {
	return findCompatibleMasterBoundProgress(
		exchange.itemExchangeList,
		(item) => item.itemExchangesId === id,
		provenance.identityFingerprint,
	);
}
export function getOrCreateUserItemExchangeState(
	exchange: UserShopExchangeState,
	id: number,
	provenance: EntityProvenance,
): UserItemExchangeState {
	const existing = findItemExchangeState(exchange, id, provenance);
	if (existing?.identityFingerprint !== undefined) return existing;
	const item = {
		...provenance,
		itemExchangesId: id,
		isLock: existing?.isLock ?? false,
		remainingExchangeNum: existing?.remainingExchangeNum ?? 0,
	};
	exchange.itemExchangeList.push(item);
	return item;
}
