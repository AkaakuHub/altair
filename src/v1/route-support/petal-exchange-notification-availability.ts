import type { Database } from 'bun:sqlite';
import {
	calculatePetalExchangeCostFromDatabase,
	getPetalExchangeCardsFromDatabase,
	getPetalExchangeIdentityFingerprint,
} from '../../master-data/petal-exchange-master.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { readNumber } from '../../state/json-state-utils.ts';
import { getPetalExchangePurchaseTotal } from '../../state/shop-petal-purchase-progress.ts';
import { canReceiveItemFromDatabase } from './item-receive-availability.ts';
import { projectUserOwnedState } from './project-user-owned-state.ts';
import { hasLimitBreakRoom } from './shop-notification-domain.ts';
import {
	findUserShopExchange,
	hasUserItem,
} from './shop-notification-user-state.ts';

const PETAL_COIN_ITEM_ID = 3007001;

export function hasAvailablePetalExchangeFromDatabase(
	database: Database,
	state: ServerState,
	user: RegisteredUserState | undefined,
): boolean {
	if (!user) return false;
	const { cards, inventory } = projectUserOwnedState(
		database,
		state,
		user.playerId,
	);
	if (!inventory || !cards) return false;
	const exchange = findUserShopExchange(state, user.playerId);
	const cardMasters = getPetalExchangeCardsFromDatabase(
		database,
		cards.userCardDataList.map((card) =>
			readNumber(card.card_datas_id, 'user card card_datas_id'),
		),
	);
	for (const card of cards.userCardDataList) {
		const cardMaster = cardMasters.get(
			readNumber(card.card_datas_id, 'user card card_datas_id'),
		);
		if (
			!cardMaster ||
			!hasLimitBreakRoom(
				readNumber(card.limit_break_times, 'user card limit_break_times'),
				readNumber(
					card.max_limit_break_times,
					'user card max_limit_break_times',
				),
			)
		)
			continue;
		const currentTotal = exchange
			? getPetalExchangePurchaseTotal(
					exchange,
					cardMaster.cardSeriesId,
					getPetalExchangeIdentityFingerprint(cardMaster),
				)
			: 0;
		const cost = calculatePetalExchangeCostFromDatabase(
			database,
			cardMaster.rarity,
			currentTotal,
			1,
		);
		if (
			cost !== undefined &&
			hasUserItem(inventory, PETAL_COIN_ITEM_ID, cost) &&
			canReceiveItemFromDatabase(
				database,
				inventory,
				cardMaster.materialItemId,
				1,
			)
		)
			return true;
	}
	return false;
}
