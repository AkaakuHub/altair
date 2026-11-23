import {
	findUserCard,
	type UserCardCollectionState,
} from '../../state/user-card-aggregate-state.ts';
import type { UserCardDataState } from '../../state/user-card-types.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import {
	consumeUserItemFromLookup,
	createUserItemLookup,
	getCardGrowthNumberField,
	getCardGrowthStringField,
	getOwnItemNum,
	uniqueNumbers,
} from './card-growth-items.ts';
import type { CardGrowthMasterSource } from './card-growth-master-source.ts';
import type { CardGrowthMutationGuard } from './card-growth-mutation-guard.ts';
import type { LimitBreakCheckResponse } from './card-growth-response.ts';

export function applyLimitBreakAvailability(
	masterSource: CardGrowthMasterSource,
	card: UserCardDataState,
	inventory: UserInventoryState,
): boolean {
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const currentLimitBreakTimes = getCardGrowthNumberField(
		card,
		'limit_break_times',
	);
	const selectableLimitBreakTimes = getCardGrowthNumberField(
		card,
		'max_limit_break_times',
	);
	if (
		cardDatasId === undefined ||
		currentLimitBreakTimes === undefined ||
		selectableLimitBreakTimes === undefined
	) {
		return false;
	}
	if (currentLimitBreakTimes >= selectableLimitBreakTimes) {
		card.is_limit_break = false;
		return true;
	}
	const requirements = masterSource.getLimitBreakRequirements(
		cardDatasId,
		currentLimitBreakTimes,
		currentLimitBreakTimes + 1,
	);
	if (requirements === undefined) {
		return false;
	}
	const itemLookup = createUserItemLookup(inventory);
	card.is_limit_break = requirements.every(
		(requirement) =>
			getOwnItemNum(itemLookup, requirement.costItemsId) >= requirement.costNum,
	);
	return true;
}

export function createCheckLimitBreakResponse(
	masterSource: CardGrowthMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
): LimitBreakCheckResponse | 'masterDataNotFound' | undefined {
	const dCardDatasId = getCardGrowthStringField(body, 'd_card_datas_id');
	const card = findUserCard(cards, dCardDatasId);
	if (!card) {
		return undefined;
	}
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const currentLimitBreakTimes = getCardGrowthNumberField(
		card,
		'limit_break_times',
	);
	const selectableLimitBreakTimes = getCardGrowthNumberField(
		card,
		'max_limit_break_times',
	);
	if (
		cardDatasId === undefined ||
		currentLimitBreakTimes === undefined ||
		selectableLimitBreakTimes === undefined
	) {
		return undefined;
	}
	const requirements =
		currentLimitBreakTimes < selectableLimitBreakTimes
			? masterSource.getLimitBreakRequirements(
					cardDatasId,
					currentLimitBreakTimes,
					selectableLimitBreakTimes,
				)
			: [];
	if (requirements === undefined) {
		return 'masterDataNotFound';
	}
	const requiredItemIds = uniqueNumbers(
		requirements.map((requirement) => requirement.costItemsId),
	);
	const itemLookup = createUserItemLookup(inventory);
	const nextRequirement = requirements.at(0);
	return {
		is_possible: nextRequirement !== undefined,
		current_limit_break_times: currentLimitBreakTimes,
		selectable_limit_break_times: selectableLimitBreakTimes,
		user_item_list: requiredItemIds.map((itemId) => ({
			item_id: itemId,
			own_num: getOwnItemNum(itemLookup, itemId),
		})),
		required_item_list: requirements.map((requirement) => ({
			cost_item_id1: requirement.costItemsId,
			cost_num1: requirement.costNum,
			cost_item_id2: 0,
			cost_num2: 0,
			cost_item_id3: 0,
			cost_num3: 0,
		})),
	};
}

export function applyLimitBreak(
	masterSource: CardGrowthMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
	mutationGuard: CardGrowthMutationGuard,
	updateCard: (update: {
		dCardDatasId: string;
		styleLevel: number;
		limitBreakTimes: number;
	}) => boolean,
):
	| 'ok'
	| 'cardNotFound'
	| 'masterDataNotFound'
	| 'unavailable'
	| 'insufficientItem'
	| 'incompatibleDefinition' {
	const dCardDatasId = getCardGrowthStringField(body, 'd_card_datas_id');
	const targetLimitBreakTimes = getCardGrowthNumberField(
		body,
		'limit_break_step',
	);
	const card = findUserCard(cards, dCardDatasId);
	if (!card || targetLimitBreakTimes === undefined) {
		return 'cardNotFound';
	}
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const styleLevel = getCardGrowthNumberField(card, 'style_level');
	const currentLimitBreakTimes = getCardGrowthNumberField(
		card,
		'limit_break_times',
	);
	const maxLimitBreakTimes = getCardGrowthNumberField(
		card,
		'max_limit_break_times',
	);
	if (
		cardDatasId === undefined ||
		styleLevel === undefined ||
		currentLimitBreakTimes === undefined ||
		maxLimitBreakTimes === undefined ||
		targetLimitBreakTimes > maxLimitBreakTimes
	) {
		return 'cardNotFound';
	}
	if (
		currentLimitBreakTimes >= maxLimitBreakTimes ||
		targetLimitBreakTimes <= currentLimitBreakTimes
	) {
		return 'unavailable';
	}
	const requirements = masterSource.getLimitBreakRequirements(
		cardDatasId,
		currentLimitBreakTimes,
		targetLimitBreakTimes,
	);
	if (requirements === undefined) {
		return 'masterDataNotFound';
	}
	const totalCostByItemId = new Map<number, number>();
	for (const requirement of requirements) {
		totalCostByItemId.set(
			requirement.costItemsId,
			(totalCostByItemId.get(requirement.costItemsId) ?? 0) +
				requirement.costNum,
		);
	}
	const itemLookup = createUserItemLookup(inventory);
	for (const [itemId, costNum] of totalCostByItemId) {
		if (getOwnItemNum(itemLookup, itemId) < costNum) {
			return 'insufficientItem';
		}
	}
	const mutationItems = [...totalCostByItemId.keys()].map((itemId) =>
		itemLookup.get(itemId),
	);
	if (
		mutationItems.some((item) => item === undefined) ||
		!mutationGuard.preflight(
			card,
			mutationItems.filter((item) => item !== undefined),
		)
	)
		return 'incompatibleDefinition';
	for (const [itemId, costNum] of totalCostByItemId) {
		if (!consumeUserItemFromLookup(itemLookup, itemId, costNum)) {
			return 'insufficientItem';
		}
	}
	if (
		!updateCard({
			dCardDatasId,
			styleLevel,
			limitBreakTimes: targetLimitBreakTimes,
		})
	) {
		return 'cardNotFound';
	}
	return 'ok';
}
