import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import type { UserGachaState } from './gacha-types.ts';

export function ensureUserGachaState(
	state: Pick<ServerState, 'userGachas'>,
	playerId: string,
): EnsureStateResult<UserGachaState> {
	const existing = state.userGachas.find(
		(gacha) => gacha.playerId === playerId,
	);
	if (existing) {
		return { value: existing, created: false };
	}
	const userGacha = {
		playerId,
		seriesProgressList: [],
		resultHistoryList: [],
		guaranteeExchangeItemList: [],
		exchangeCardList: [],
		purchasePlans: [],
		paidOnlyPurchaseList: [],
	};
	state.userGachas = [...state.userGachas, userGacha];
	return { value: userGacha, created: true };
}
