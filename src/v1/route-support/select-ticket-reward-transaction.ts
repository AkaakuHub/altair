import type { Database } from 'bun:sqlite';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import type { EntityProvenance } from '../../state/entity-provenance.ts';
import type { GachaReceiptItemState } from '../../state/gacha-guarantee-types.ts';
import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import { addUserCardFromTemplate } from '../../state/user-card-template-state.ts';
import type { UserCardTemplateState } from '../../state/user-card-types.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import { consumeUserItem } from '../../state/user-item-mutation.ts';
import { applyGachaReceiptRewardsToState } from './gacha-receipt-rewards.ts';
import { createMasterReleaseItemProvenance } from './item-consumption.ts';
import type { StateRouteContext } from './state-route-context.ts';

type SelectTicketSession = {
	user: RegisteredUserState;
	userGacha: { selectTicketExchangeMasterReleaseId?: string };
	sourceMasterReleaseId: string;
	database: Database;
};

export function applySelectTicketRewardTransaction(
	routeContext: StateRouteContext,
	session: SelectTicketSession,
	inventory: UserInventoryState,
	cards: UserCardCollectionState,
	exchangeTicketItemId: number,
	receiptItems: readonly GachaReceiptItemState[],
	cardTemplate: UserCardTemplateState | undefined,
	cardProvenance: EntityProvenance | undefined,
): boolean {
	const ticketProvenance = createMasterReleaseItemProvenance(
		session.database,
		session.sourceMasterReleaseId,
		exchangeTicketItemId,
	);
	if (ticketProvenance === undefined) return false;
	if (
		!applyGachaReceiptRewardsToState(
			session.database,
			routeContext,
			session.user.playerId,
			routeContext.userItemsGetList,
			receiptItems,
			session.sourceMasterReleaseId,
			() =>
				consumeUserItem(
					inventory,
					'',
					exchangeTicketItemId,
					1,
					ticketProvenance,
				),
		)
	)
		return false;
	if (receiptItems.some((item) => item.get_item_type === 2 && item.is_new)) {
		if (!cardTemplate || !cardProvenance) return false;
		addUserCardFromTemplate(cards, cardTemplate, cardProvenance);
	}
	delete session.userGacha.selectTicketExchangeMasterReleaseId;
	return true;
}
