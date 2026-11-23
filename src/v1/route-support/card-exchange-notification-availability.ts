import type { Database } from 'bun:sqlite';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import { getExchangeDuplicateCardRewardFromDatabase } from '../../master-data/gacha-duplicate-card-reward.ts';
import { getGachaExchangeCardsBySelectTicketSeriesIdsFromDatabase } from '../../master-data/gacha-exchange-card-master.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import type { ShopExchangeMaster } from '../../state/shop-exchange-definition.ts';
import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import { hasUserCardTemplateSeries } from '../../state/user-card-aggregate-state.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import { getShopExchangeMasterFromDatabase } from '../active-master-database/shop-exchange-responses.ts';
import { canReceiveItemFromDatabase } from './item-receive-availability.ts';
import { projectUserOwnedState } from './project-user-owned-state.ts';
import { getSelectTicketExchangeListFromInventory } from './select-ticket-exchange-route-state.ts';
import {
	findUserShopExchange,
	hasUserItem,
} from './shop-notification-user-state.ts';

const ITEM_TYPE_CARD = 2;
const PETAL_COIN_ITEM_ID = 3007001;

export function hasAvailableGpPrizeExchangeFromDatabase(
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
	if (!inventory) return false;
	const exchange = findUserShopExchange(state, user.playerId);
	for (const item of getShopExchangeMasterFromDatabase(database)
		.gpPrizeExchangeList) {
		const entry = exchange?.gpPrizeExchangeList.find(
			(candidate) => candidate.gpPrizeExchangesId === item.gpPrizeExchangesId,
		);
		if (
			item.gpPrizeExchangesId === undefined ||
			item.materialItemId === undefined ||
			item.materialItemNum === undefined ||
			item.productItemType === undefined ||
			item.productItemId === undefined ||
			item.productItemNum === undefined ||
			entry === undefined ||
			!hasUserItem(inventory, item.materialItemId, item.materialItemNum)
		)
			continue;
		if (canReceiveGpPrizeProduct(database, cards, inventory, item)) return true;
	}
	return false;
}

export function hasAvailableSelectTicketExchangeFromDatabase(
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
	return getSelectTicketExchangeListFromInventory(database, inventory).some(
		(item) =>
			getGachaExchangeCardsBySelectTicketSeriesIdsFromDatabase(database, [
				item.selectTicketSeriesId,
			]).some((card) =>
				canReceiveSelectTicketExchangeCard(
					database,
					inventory,
					cards,
					card.cardDatasId,
				),
			),
	);
}

function canReceiveGpPrizeProduct(
	database: Database,
	cards: UserCardCollectionState | undefined,
	inventory: UserInventoryState,
	product: ShopExchangeMaster['gpPrizeExchangeList'][number],
): boolean {
	if (
		product.productItemType !== ITEM_TYPE_CARD ||
		product.productItemId === undefined ||
		product.productItemNum === undefined
	)
		return false;
	const template = getCardDetailTemplateByCardDatasIdFromDatabase(
		database,
		product.productItemId,
	);
	if (!template) return false;
	if (!cards || !hasUserCardTemplateSeries(cards, template)) return true;
	const duplicateReward = getExchangeDuplicateCardRewardFromDatabase(
		database,
		product.productItemId,
	);
	return (
		duplicateReward !== undefined &&
		canReceiveItemFromDatabase(
			database,
			inventory,
			duplicateReward.materialLimitBreakItemId,
			duplicateReward.materialLimitBreakNum * product.productItemNum,
		)
	);
}

function canReceiveSelectTicketExchangeCard(
	database: Database,
	inventory: UserInventoryState,
	cards: UserCardCollectionState,
	cardDatasId: number,
): boolean {
	const template = getCardDetailTemplateByCardDatasIdFromDatabase(
		database,
		cardDatasId,
	);
	if (!template) return false;
	if (!hasUserCardTemplateSeries(cards, template)) return true;
	const duplicateReward = getExchangeDuplicateCardRewardFromDatabase(
		database,
		cardDatasId,
	);
	return (
		duplicateReward !== undefined &&
		canReceiveItemFromDatabase(
			database,
			inventory,
			duplicateReward.materialLimitBreakItemId,
			duplicateReward.materialLimitBreakNum,
		) &&
		canReceiveItemFromDatabase(
			database,
			inventory,
			PETAL_COIN_ITEM_ID,
			duplicateReward.coinNum,
		)
	);
}
