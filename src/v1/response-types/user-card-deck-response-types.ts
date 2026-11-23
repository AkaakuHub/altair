import type { JsonObject } from '../../state/json-state-utils.ts';
import type {
	UserCardDataState,
	UserCardTemplateFields,
} from '../../state/user-card-types.ts';
import type { UserDeckCardState } from '../../state/user-deck-definition.ts';

export type UserCardDataResponse = JsonObject &
	Pick<UserCardDataState, 'card_datas_id' | 'd_card_datas_id'> &
	Partial<UserCardTemplateFields>;

export type UserCardsResponse = {
	user_card_data_list: UserCardDataResponse[];
};

export type UserCardDetailResponse = {
	user_card_data: UserCardDataResponse;
};

export type DeckBaseResponse = {
	d_deck_datas_id: string;
	deck_name: string;
	deck_no: number;
	generations_id: number;
	deck_cards_list: UserDeckCardState[];
	is_change_deck_cards: null;
};

export type DeckResponse =
	| DeckBaseResponse
	| (DeckBaseResponse & { ace_card: string });

export type DeckListResponse = {
	deck_list: DeckResponse[];
	user_card_data_list: UserCardDataResponse[];
	rental_deck_list: [];
	rental_card_data_list: [];
};

export type ModifiedDeckListResponse = {
	deck_list: DeckResponse[];
};
