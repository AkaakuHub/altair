import type { JsonValue } from '../state/json-state-utils.ts';
import { isRecord } from '../state/json-state-utils.ts';
import type { UserRhythmGameDeckState } from '../state/user-rhythm-game-types.ts';

export function projectRhythmGameDecks(
	canonical: readonly UserRhythmGameDeckState[],
	visibleCardDataIds: ReadonlySet<string>,
): UserRhythmGameDeckState[] {
	return canonical.map((deck) => ({
		...deck,
		deckCardList: deck.deckCardList.filter((card) =>
			isVisibleDeckCard(card, visibleCardDataIds),
		),
	}));
}

export function mergeRhythmGameDeckCards(
	canonical: readonly JsonValue[],
	incoming: readonly JsonValue[],
	visibleCardDataIds: ReadonlySet<string>,
): JsonValue[] {
	return [
		...canonical.filter((card) => !isVisibleDeckCard(card, visibleCardDataIds)),
		...incoming,
	];
}

function isVisibleDeckCard(
	card: JsonValue,
	visibleCardDataIds: ReadonlySet<string>,
): boolean {
	if (!isRecord(card)) return true;
	const cardDataId = card.d_card_datas_id;
	return typeof cardDataId !== 'string' || visibleCardDataIds.has(cardDataId);
}
