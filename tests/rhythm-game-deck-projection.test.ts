import { describe, expect, test } from 'bun:test';
import {
	mergeRhythmGameDeckCards,
	projectRhythmGameDecks,
} from '../src/application/rhythm-game-deck-projection.ts';

const visibleCard = {
	rhythm_game_deck_cards_id: 'visible-slot',
	d_card_datas_id: 'visible-card',
};
const hiddenCard = {
	rhythm_game_deck_cards_id: 'hidden-slot',
	d_card_datas_id: 'hidden-card',
};

describe('rhythm game deck projection', () => {
	test('hides unsupported cards without changing canonical deck', () => {
		const canonical = [
			{
				rhythmGameDeckId: 'deck-a',
				name: 'deck',
				deckNo: 1,
				deckCardList: [visibleCard, hiddenCard],
			},
		];

		expect(
			projectRhythmGameDecks(canonical, new Set(['visible-card']))[0]
				?.deckCardList,
		).toEqual([visibleCard]);
		expect(canonical[0]?.deckCardList).toEqual([visibleCard, hiddenCard]);
	});

	test('keeps hidden canonical cards when visible projection is written', () => {
		const modifiedVisibleCard = { ...visibleCard, slot_no: 2 };

		expect(
			mergeRhythmGameDeckCards(
				[visibleCard, hiddenCard],
				[modifiedVisibleCard],
				new Set(['visible-card']),
			),
		).toEqual([hiddenCard, modifiedVisibleCard]);
	});
});
