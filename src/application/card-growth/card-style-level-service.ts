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
	type UserItemLookup,
} from './card-growth-items.ts';
import type { CardGrowthMasterSource } from './card-growth-master-source.ts';
import type { CardGrowthMutationGuard } from './card-growth-mutation-guard.ts';
import type { StyleLevelUpCheckResponse } from './card-growth-response.ts';

const STYLE_POINT_ITEM_ID = 3004000;

export function createCheckStyleLevelUpResponse(
	masterSource: CardGrowthMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
): StyleLevelUpCheckResponse | undefined {
	const dCardDatasId = getCardGrowthStringField(body, 'd_card_datas_id');
	const card = findUserCard(cards, dCardDatasId);
	if (!card) {
		return undefined;
	}
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const currentStyleLevel = getCardGrowthNumberField(card, 'style_level');
	const selectableMaxLevel = getCardGrowthNumberField(card, 'max_style_level');
	if (
		cardDatasId === undefined ||
		currentStyleLevel === undefined ||
		selectableMaxLevel === undefined
	) {
		return undefined;
	}
	const availability = getStyleLevelUpAvailability(
		masterSource,
		cardDatasId,
		currentStyleLevel,
		selectableMaxLevel,
		createUserItemLookup(inventory),
	);
	return {
		is_possible: availability.isPossible,
		current_style_level: currentStyleLevel,
		selectable_max_level: selectableMaxLevel,
		style_point: availability.stylePoint,
	};
}

export function applyStyleLevelUpAvailability(
	masterSource: CardGrowthMasterSource,
	card: UserCardDataState,
	inventory: UserInventoryState,
): boolean {
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const currentStyleLevel = getCardGrowthNumberField(card, 'style_level');
	const selectableMaxLevel = getCardGrowthNumberField(card, 'max_style_level');
	if (
		cardDatasId === undefined ||
		currentStyleLevel === undefined ||
		selectableMaxLevel === undefined
	) {
		return false;
	}
	card.is_style_level_up = getStyleLevelUpAvailability(
		masterSource,
		cardDatasId,
		currentStyleLevel,
		selectableMaxLevel,
		createUserItemLookup(inventory),
	).isPossible;
	return true;
}

export function applyStyleLevelUp(
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
	| 'insufficientItem'
	| 'incompatibleDefinition' {
	const dCardDatasId = getCardGrowthStringField(body, 'd_card_datas_id');
	const targetStyleLevel = getCardGrowthNumberField(body, 'style_level');
	const card = findUserCard(cards, dCardDatasId);
	if (!card || targetStyleLevel === undefined) {
		return 'cardNotFound';
	}
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const currentStyleLevel = getCardGrowthNumberField(card, 'style_level');
	const maxStyleLevel = getCardGrowthNumberField(card, 'max_style_level');
	const limitBreakTimes = getCardGrowthNumberField(card, 'limit_break_times');
	if (
		cardDatasId === undefined ||
		currentStyleLevel === undefined ||
		maxStyleLevel === undefined ||
		limitBreakTimes === undefined ||
		targetStyleLevel > maxStyleLevel
	) {
		return 'cardNotFound';
	}
	const cost = masterSource.getStyleLevelCost(
		cardDatasId,
		currentStyleLevel,
		targetStyleLevel,
	);
	if (cost === undefined) {
		return 'masterDataNotFound';
	}
	const itemLookup = createUserItemLookup(inventory);
	const stylePointItem = itemLookup.get(STYLE_POINT_ITEM_ID);
	if (getOwnItemNum(itemLookup, STYLE_POINT_ITEM_ID) < cost) {
		return 'insufficientItem';
	}
	if (
		stylePointItem === undefined ||
		!mutationGuard.preflight(card, [stylePointItem])
	) {
		return 'incompatibleDefinition';
	}
	if (!consumeUserItemFromLookup(itemLookup, STYLE_POINT_ITEM_ID, cost)) {
		return 'insufficientItem';
	}
	if (
		!updateCard({ dCardDatasId, styleLevel: targetStyleLevel, limitBreakTimes })
	) {
		return 'cardNotFound';
	}
	return 'ok';
}

function getStyleLevelUpAvailability(
	masterSource: CardGrowthMasterSource,
	cardDatasId: number,
	currentStyleLevel: number,
	selectableMaxLevel: number,
	itemLookup: UserItemLookup,
): { isPossible: boolean; stylePoint: number } {
	const stylePoint = getOwnItemNum(itemLookup, STYLE_POINT_ITEM_ID);
	const nextCost =
		currentStyleLevel < selectableMaxLevel
			? masterSource.getStyleLevelCost(
					cardDatasId,
					currentStyleLevel,
					currentStyleLevel + 1,
				)
			: undefined;
	return {
		isPossible:
			nextCost !== undefined &&
			stylePoint >= nextCost &&
			currentStyleLevel < selectableMaxLevel,
		stylePoint,
	};
}
