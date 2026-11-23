import { isRecord } from './json-state-utils.ts';
import type {
	UserDeckCardState,
	UserDeckDataState,
	UserDeckState,
} from './user-deck-definition.ts';

export function isUserDeckState(value: unknown): value is UserDeckState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		Array.isArray(value.decks) &&
		value.decks.every(isUserDeckDataState)
	);
}

function isUserDeckDataState(value: unknown): value is UserDeckDataState {
	return (
		isRecord(value) &&
		typeof value.deckDataId === 'string' &&
		typeof value.deckName === 'string' &&
		typeof value.deckNo === 'number' &&
		typeof value.generationsId === 'number' &&
		typeof value.aceCard === 'string' &&
		Array.isArray(value.deckCardsList) &&
		value.deckCardsList.every(isUserDeckCardState)
	);
}

function isUserDeckCardState(value: unknown): value is UserDeckCardState {
	return (
		isRecord(value) &&
		typeof value.d_deck_cards_id === 'string' &&
		typeof value.slot_no === 'number' &&
		(!('d_card_datas_id' in value) ||
			typeof value.d_card_datas_id === 'string') &&
		(!('side_style1_d_card_datas_id' in value) ||
			typeof value.side_style1_d_card_datas_id === 'string') &&
		(!('side_style2_d_card_datas_id' in value) ||
			typeof value.side_style2_d_card_datas_id === 'string')
	);
}
