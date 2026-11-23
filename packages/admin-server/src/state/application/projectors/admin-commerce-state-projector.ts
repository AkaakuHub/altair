import type { AdminVisibleServerState } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import type { AdminStatePage } from '../../domain/admin-state-page.ts';

type CommerceStateView = Pick<
	AdminVisibleServerState,
	| 'gachaSeriesActivations'
	| 'loginBonusActivations'
	| 'selectTicketSeriesActivations'
	| 'userGachas'
	| 'userInventories'
	| 'userPresentBoxes'
	| 'userShopExchanges'
>;

export function projectAdminCommerceState(
	state: ServerState,
	page: AdminStatePage,
): CommerceStateView {
	const all = page === 'all';
	return {
		loginBonusActivations:
			all || page === 'login-bonus' || page === 'login-bonus-server'
				? state.loginBonusActivations
				: [],
		gachaSeriesActivations:
			all || page === 'gacha' || page === 'gacha-server'
				? state.gachaSeriesActivations
				: [],
		selectTicketSeriesActivations:
			all || page === 'gacha' || page === 'gacha-server'
				? state.selectTicketSeriesActivations
				: [],
		userInventories:
			all || page === 'items' || page === 'quest' ? state.userInventories : [],
		userPresentBoxes:
			all || page === 'archive' || page === 'present-box'
				? state.userPresentBoxes
				: [],
		userGachas: all || page === 'gacha' ? state.userGachas : [],
		userShopExchanges: all || page === 'items' ? state.userShopExchanges : [],
	};
}
