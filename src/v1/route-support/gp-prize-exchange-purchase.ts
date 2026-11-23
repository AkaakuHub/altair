import type { Database } from 'bun:sqlite';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import {
	getCardIdentityFingerprint,
	getItemIdentityFingerprint,
} from '../../master-data/entity-identity-fingerprints.ts';
import { getExchangeDuplicateCardRewardFromDatabase } from '../../master-data/gacha-duplicate-card-reward.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import type { GpPrizeExchangePurchaseMaster } from '../../master-data/shop-exchange-purchase-master.ts';
import type { ServerState } from '../../server-state-schema.ts';
import type { EntityProvenance } from '../../state/entity-provenance.ts';
import type { UserShopExchangeState } from '../../state/shop-exchange-types.ts';
import { markGpPrizeExchangePurchased } from '../../state/shop-gp-prize-progress.ts';
import {
	ensureUserCards,
	hasUserCardTemplateSeries,
} from '../../state/user-card-aggregate-state.ts';
import { addUserCardFromTemplate } from '../../state/user-card-template-state.ts';
import { findUserInventory } from '../../state/user-inventory-aggregate.ts';
import { addUserItemQuantity } from '../../state/user-item-mutation.ts';
import { canReceiveItemFromDatabase } from './item-receive-availability.ts';

const CARD_ITEM_TYPE = 2;

type GpPrizeExchangeProductPurchase = {
	apply: () => boolean;
};

export function resolveGpPrizeExchangeProductPurchase(
	database: Database,
	sourceMasterReleaseId: string,
	state: ServerState,
	playerId: string,
	userCardGetList: unknown,
	exchange: UserShopExchangeState,
	master: GpPrizeExchangePurchaseMaster,
	exchangeProvenance: EntityProvenance,
): GpPrizeExchangeProductPurchase | undefined {
	if (master.productItemType !== CARD_ITEM_TYPE) {
		return undefined;
	}
	const template = getCardDetailTemplateByCardDatasIdFromDatabase(
		database,
		master.productItemId,
	);
	if (!template) {
		return undefined;
	}
	const cardIdentityFingerprint = getCardIdentityFingerprint(
		database,
		master.productItemId,
	);
	if (cardIdentityFingerprint === undefined) return undefined;
	const userCards = ensureUserCards(state, playerId, userCardGetList).value;
	const isDuplicate = hasUserCardTemplateSeries(userCards, template);
	if (!isDuplicate) {
		return {
			apply: () => {
				addUserCardFromTemplate(userCards, template, {
					sourceMasterReleaseId,
					identityFingerprint: cardIdentityFingerprint,
				});
				return markGpPrizeExchangePurchased(
					exchange,
					master.gpPrizeExchangesId,
					exchangeProvenance,
				);
			},
		};
	}
	const duplicateReward = getExchangeDuplicateCardRewardFromDatabase(
		database,
		master.productItemId,
	);
	if (!duplicateReward) {
		return undefined;
	}
	const itemDefinition = getItemDefinitionByItemIdFromDatabase(
		database,
		duplicateReward.materialLimitBreakItemId,
	);
	if (!itemDefinition) {
		return undefined;
	}
	const itemIdentityFingerprint = getItemIdentityFingerprint(
		database,
		duplicateReward.materialLimitBreakItemId,
	);
	if (itemIdentityFingerprint === undefined) return undefined;
	const inventory = findUserInventory(state, playerId);
	if (
		!inventory ||
		!canReceiveItemFromDatabase(
			database,
			inventory,
			duplicateReward.materialLimitBreakItemId,
			duplicateReward.materialLimitBreakNum * master.productItemNum,
		)
	) {
		return undefined;
	}
	return {
		apply: () => {
			addUserItemQuantity(
				state,
				playerId,
				itemDefinition,
				duplicateReward.materialLimitBreakNum * master.productItemNum,
				{
					sourceMasterReleaseId,
					identityFingerprint: itemIdentityFingerprint,
				},
			);
			return markGpPrizeExchangePurchased(
				exchange,
				master.gpPrizeExchangesId,
				exchangeProvenance,
			);
		},
	};
}
