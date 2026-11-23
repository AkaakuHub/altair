import type {
	UserDeckDataState,
	UserDeckState,
} from '../../state/user-deck-definition.ts';
import type {
	DeckBaseResponse,
	DeckListResponse,
	DeckResponse,
	ModifiedDeckListResponse,
	UserCardDataResponse,
} from '../response-types/user-card-deck-response-types.ts';

export function createDeckListResponse(
	userDeck: UserDeckState,
	userCardDataList: UserCardDataResponse[],
): DeckListResponse {
	return {
		deck_list: userDeck.decks.map(createDeckResponse),
		user_card_data_list: userCardDataList,
		rental_deck_list: [],
		rental_card_data_list: [],
	};
}

export function createModifiedDeckListResponse(
	modifiedDecks: readonly UserDeckDataState[],
): ModifiedDeckListResponse {
	return { deck_list: modifiedDecks.map(createDeckResponse) };
}

export function createDeckResponse(deck: UserDeckDataState): DeckResponse {
	const response: DeckBaseResponse = {
		d_deck_datas_id: deck.deckDataId,
		deck_name: deck.deckName,
		deck_no: deck.deckNo,
		generations_id: deck.generationsId,
		deck_cards_list: deck.deckCardsList.map((card) => ({ ...card })),
		is_change_deck_cards: null,
	};
	if (deck.aceCard.length > 0) {
		return {
			...response,
			ace_card: deck.aceCard,
		};
	}
	return response;
}
