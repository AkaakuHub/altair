import type { EnsureStateResult } from './ensure-state-result.ts';
import type {
	UserDeckDataState,
	UserDeckState,
} from './user-deck-definition.ts';

export function ensureUserDecks(
	state: { userDecks: UserDeckState[] },
	playerId: string,
	defaultDecks: UserDeckDataState[],
): EnsureStateResult<UserDeckState> {
	const existing = state.userDecks.find((deck) => deck.playerId === playerId);
	if (existing) return { value: existing, created: false };
	const userDeck = { playerId, decks: defaultDecks.map(cloneDeck) };
	state.userDecks = [...state.userDecks, userDeck];
	return { value: userDeck, created: true };
}

export function findUserDeckById(
	userDeck: UserDeckState,
	deckDataId: string,
): UserDeckDataState | undefined {
	return userDeck.decks.find((deck) => deck.deckDataId === deckDataId);
}

function cloneDeck(deck: UserDeckDataState): UserDeckDataState {
	return { ...deck, deckCardsList: structuredClone(deck.deckCardsList) };
}
