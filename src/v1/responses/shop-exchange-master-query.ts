import type { Database } from 'bun:sqlite';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import {
	getPetalExchangeCardsFromDatabase,
	type PetalExchangeCardMaster,
} from '../../master-data/petal-exchange-master.ts';
import {
	getLimitBreakMaterialConvertMasterFromDatabase,
	type LimitBreakMaterialConvertMaster,
} from '../../master-data/shop-exchange-purchase-master.ts';
import { readNumber } from '../../state/json-state-utils.ts';
import type { GpPrizeExchangeMaster } from '../../state/shop-exchange-definition.ts';
import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import type { UserCardTemplateState } from '../../state/user-card-types.ts';

export function getPetalExchangeCardMasters(
	database: Database,
	userCards: UserCardCollectionState,
): ReadonlyMap<number, PetalExchangeCardMaster> {
	return getPetalExchangeCardsFromDatabase(
		database,
		userCards.userCardDataList.map((card) =>
			readNumber(card.card_datas_id, 'user card card_datas_id'),
		),
	);
}

export function getGpPrizeProductCardTemplate(
	database: Database,
	master: GpPrizeExchangeMaster,
): UserCardTemplateState | undefined {
	if (
		master.productItemType !== 2 ||
		typeof master.productItemId !== 'number'
	) {
		return undefined;
	}
	const template = getCardDetailTemplateByCardDatasIdFromDatabase(
		database,
		master.productItemId,
	);
	if (!template) {
		throw new Error(
			`gp prize card template not found: ${master.productItemId}`,
		);
	}
	return template;
}

export function getLimitBreakMaterialConvertMasters(
	database: Database,
): readonly LimitBreakMaterialConvertMaster[] {
	return getLimitBreakMaterialConvertMasterFromDatabase(database);
}
