import type { Database } from 'bun:sqlite';
import type { EntityProvenance } from '../../state/entity-provenance.ts';
import { exchangeGachaGuaranteePointItem } from '../../state/gacha-guarantee-exchange-state.ts';
import { addUserCardFromTemplate } from '../../state/user-card-template-state.ts';
import type { UserCardTemplateState } from '../../state/user-card-types.ts';
import { applyGachaReceiptRewardsToState } from './gacha-receipt-rewards.ts';
import type { StateRouteContext } from './state-route-context.ts';

type ExchangeArguments = Parameters<typeof exchangeGachaGuaranteePointItem>;

export function applyGachaGuaranteeRewardTransaction(
	database: Database,
	routeContext: StateRouteContext,
	playerId: string,
	sourceMasterReleaseId: string,
	userGacha: ExchangeArguments[0],
	userCards: ExchangeArguments[1],
	resolveCardTemplate: ExchangeArguments[2],
	exchangeRate: ExchangeArguments[3],
	seriesProvenance: ExchangeArguments[4],
	resolveDuplicateReward: ExchangeArguments[5],
	cardTemplate: UserCardTemplateState | undefined,
	cardProvenance: EntityProvenance | undefined,
) {
	return exchangeGachaGuaranteePointItem(
		userGacha,
		userCards,
		resolveCardTemplate,
		exchangeRate,
		seriesProvenance,
		resolveDuplicateReward,
		(items) => {
			if (
				!applyGachaReceiptRewardsToState(
					database,
					routeContext,
					playerId,
					routeContext.userItemsGetList,
					items,
					sourceMasterReleaseId,
				)
			)
				return false;
			if (items.some((item) => item.get_item_type === 2 && item.is_new)) {
				if (!cardTemplate || !cardProvenance) return false;
				return addUserCardFromTemplate(userCards, cardTemplate, cardProvenance);
			}
			return true;
		},
	);
}
