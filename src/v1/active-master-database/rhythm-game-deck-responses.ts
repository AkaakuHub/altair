import { mergeRhythmGameDeckCards } from '../../application/rhythm-game-deck-projection.ts';
import type { JsonValue } from '../../state/json-state-utils.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { ensureUserRhythmGameDecks } from '../../state/user-rhythm-game-deck-state.ts';
import type { UserRhythmGameDeckState } from '../../state/user-rhythm-game-types.ts';
import {
	getStringField,
	isJsonRecord,
} from '../route-support/request-fields.ts';
import { isJsonValue, numberValue } from './json-utils.ts';
import type { StoredResponse } from './types.ts';

type EmptyStoredResponse = StoredResponse & {
	body: null;
};

export function modifyRhythmGameDeckList(
	body: unknown,
	userLive: UserLiveState,
	visibleCardDataIds: ReadonlySet<string>,
): EmptyStoredResponse | undefined {
	if (!isJsonRecord(body) || !Array.isArray(body.modify_deck_list)) {
		return undefined;
	}
	const currentDecks = ensureUserRhythmGameDecks(
		userLive,
		createDefaultRhythmGameDecks(),
	);
	for (const rawDeck of body.modify_deck_list) {
		if (!isJsonRecord(rawDeck)) {
			continue;
		}
		const deckNo = numberValue(rawDeck.deck_no);
		const existing = currentDecks.find((deck) => deck.deckNo === deckNo);
		const deckId = existing?.rhythmGameDeckId ?? crypto.randomUUID();
		const cardList = mergeRhythmGameDeckCards(
			existing?.deckCardList ?? [],
			readRhythmGameDeckCardList(rawDeck.deck_card_list),
			visibleCardDataIds,
		);
		userLive.rhythmGameDecks = [
			...userLive.rhythmGameDecks.filter((deck) => deck.deckNo !== deckNo),
			{
				rhythmGameDeckId: deckId,
				name: getStringField(rawDeck, 'name'),
				deckNo,
				deckCardList: cardList,
			},
		].sort((left, right) => left.deckNo - right.deckNo);
	}
	return { body: null, statusCode: 200 };
}

export function setRhythmGameDeckName(
	body: unknown,
	userLive: UserLiveState,
): EmptyStoredResponse | undefined {
	if (!isJsonRecord(body)) return undefined;
	const deckNo = numberValue(body.deck_no);
	const decks = ensureUserRhythmGameDecks(
		userLive,
		createDefaultRhythmGameDecks(),
	);
	if (!decks.some((deck) => deck.deckNo === deckNo)) return undefined;
	userLive.rhythmGameDecks = decks.map((deck) =>
		deck.deckNo === deckNo
			? { ...deck, name: getStringField(body, 'name') }
			: deck,
	);
	return { body: null, statusCode: 200 };
}

function readRhythmGameDeckCardList(value: unknown): JsonValue[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter(isJsonValue).map((card) => {
		if (!isJsonRecord(card)) {
			return card;
		}
		return {
			...card,
			rhythm_game_deck_cards_id:
				getStringField(card, 'rhythm_game_deck_cards_id') ||
				crypto.randomUUID(),
		};
	});
}

function createDefaultRhythmGameDecks(): UserRhythmGameDeckState[] {
	return [];
}
