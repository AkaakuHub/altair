import type {
	DuplicateCardRewardResolver,
	GachaSelectTicketExchangeRate,
} from './gacha-definition.ts';
import type {
	GachaExchangeCardState,
	GachaReceiptItemState,
} from './gacha-guarantee-types.ts';
import {
	hasUserCardTemplateSeries,
	type UserCardCollectionState,
} from './user-card-aggregate-state.ts';
import type { UserCardTemplateState } from './user-card-types.ts';

type CardTemplateResolver = (
	cardDatasId: number,
) => UserCardTemplateState | undefined;

export function createSelectTicketExchangeReceiptItems(
	userCards: UserCardCollectionState,
	resolveCardTemplate: CardTemplateResolver,
	exchangeRate: GachaSelectTicketExchangeRate,
	exchangeCardList: readonly GachaExchangeCardState[],
	resolveDuplicateCardReward: DuplicateCardRewardResolver,
): GachaReceiptItemState[] | undefined {
	if (
		exchangeRate.exchangeItemType === 2 &&
		!exchangeCardList.some(
			(card) => card.cardDatasId === exchangeRate.exchangeItemId,
		)
	) {
		return undefined;
	}
	return createGachaExchangeReceiptItems(
		userCards,
		resolveCardTemplate,
		exchangeRate.exchangeItemType,
		exchangeRate.exchangeItemId,
		exchangeRate.exchangeItemQuantity,
		resolveDuplicateCardReward,
	);
}

export function createGachaExchangeReceiptItems(
	userCards: UserCardCollectionState,
	resolveCardTemplate: CardTemplateResolver,
	exchangeItemType: number,
	exchangeItemId: number,
	exchangeItemQuantity: number,
	resolveDuplicateCardReward: DuplicateCardRewardResolver,
): GachaReceiptItemState[] | undefined {
	if (exchangeItemType !== 2) {
		return [
			{
				get_id: exchangeItemId,
				get_item_type: exchangeItemType,
				get_num: exchangeItemQuantity,
				is_new: false,
			},
		];
	}
	const template = resolveCardTemplate(exchangeItemId);
	if (!template) return undefined;
	const isNew = !hasUserCardTemplateSeries(userCards, template);
	if (isNew) {
		return [
			{
				get_id: exchangeItemId,
				get_item_type: exchangeItemType,
				get_num: exchangeItemQuantity,
				is_new: true,
			},
		];
	}
	const duplicateReward = resolveDuplicateCardReward(exchangeItemId);
	if (!duplicateReward) return undefined;
	return [
		{
			get_id: duplicateReward.materialLimitBreakItemId,
			get_item_type: 4,
			get_num: duplicateReward.materialLimitBreakNum * exchangeItemQuantity,
			is_new: false,
		},
		{
			get_id: 3007001,
			get_item_type: 3,
			get_num: duplicateReward.coinNum * exchangeItemQuantity,
			is_new: false,
		},
	];
}
