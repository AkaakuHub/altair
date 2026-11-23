import { hasGachaGuaranteeExchangeProgress } from '../state/gacha-guarantee-ownership.ts';
import type { UserGachaState } from '../state/gacha-types.ts';

export function migrateUserGachaState(userGacha: UserGachaState): void {
	userGacha.paidOnlyPurchaseList ??= [];
	userGacha.guaranteeExchangeItemList =
		userGacha.guaranteeExchangeItemList.filter(
			hasGachaGuaranteeExchangeProgress,
		);
	delete (userGacha as { selectTicketExchangeList?: unknown })
		.selectTicketExchangeList;
}
