import type { EnsureStateResult } from './ensure-state-result.ts';
import { readNumber } from './json-state-utils.ts';
import { createUserCardsFromSeed } from './user-card-seed-repair.ts';
import type {
	UserCardDataState,
	UserCardTemplateState,
} from './user-card-types.ts';

export type UserCardCollectionState = {
	playerId: string;
	userCardDataList: UserCardDataState[];
};

type UserCardCollectionContainer = {
	userCards: UserCardCollectionState[];
};

export function ensureUserCards(
	state: UserCardCollectionContainer,
	playerId: string,
	seed: unknown,
): EnsureStateResult<UserCardCollectionState> {
	const existing = findUserCards(state, playerId);
	if (existing) {
		return { value: existing, created: false };
	}
	const cards = createUserCardsFromSeed(playerId, seed);
	state.userCards = [...state.userCards, cards];
	return { value: cards, created: true };
}

export function ensureEmptyUserCards(
	state: UserCardCollectionContainer,
	playerId: string,
): UserCardCollectionState {
	const existing = findUserCards(state, playerId);
	if (existing) {
		return existing;
	}
	const cards = {
		playerId,
		userCardDataList: [],
	};
	state.userCards = [...state.userCards, cards];
	return cards;
}

export function findUserCards(
	state: UserCardCollectionContainer,
	playerId: string,
): UserCardCollectionState | undefined {
	return state.userCards.find((cards) => cards.playerId === playerId);
}

export function findUserCard(
	cards: UserCardCollectionState,
	dCardDatasId: string,
): UserCardDataState | undefined {
	return cards.userCardDataList.find(
		(card) => card.d_card_datas_id === dCardDatasId,
	);
}

export function hasUserCardSeries(
	cards: UserCardCollectionState,
	cardSeriesId: number,
): boolean {
	return findUserCardIndexBySeries(cards, cardSeriesId) >= 0;
}

export function findUserCardIndexBySeries(
	cards: UserCardCollectionState,
	cardSeriesId: number,
): number {
	return cards.userCardDataList.findIndex(
		(card) => readUserCardSeriesId(card) === cardSeriesId,
	);
}

export function hasUserCardTemplateSeries(
	cards: UserCardCollectionState,
	template: UserCardTemplateState,
): boolean {
	return hasUserCardSeries(cards, readUserCardSeriesId(template));
}

export function getOwnedUserCardSeriesIds(
	cards: UserCardCollectionState,
): Set<number> {
	return getUserCardListSeriesIds(cards.userCardDataList);
}

export function getUserCardListSeriesIds(
	userCardDataList: readonly UserCardDataState[],
): Set<number> {
	return new Set(userCardDataList.map(readUserCardSeriesId));
}

export function readUserCardSeriesId(card: UserCardDataState): number {
	if (typeof card.card_series_id === 'number') {
		return card.card_series_id;
	}
	const cardDatasId = readNumber(card.card_datas_id, 'user card card_datas_id');
	return cardDatasIdToSeriesId(cardDatasId);
}

export function cardDatasIdToSeriesId(cardDatasId: number): number {
	return Math.trunc(cardDatasId / 10);
}
