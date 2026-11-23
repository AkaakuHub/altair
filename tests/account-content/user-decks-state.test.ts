import { describe, expect, test } from 'bun:test';
import { projectUserDecks } from '../../src/application/user-deck-projection.ts';
import { ensureUserDecks } from '../../src/state/user-deck-aggregate.ts';
import type { UserDeckState } from '../../src/state/user-deck-definition.ts';
import {
	mergeDeckCardReference,
	modifyUserDeckList,
} from '../../src/state/user-deck-mutation.ts';

describe('user deck state repair', () => {
	test('does not migrate existing empty user deck state in ensureUserDecks', () => {
		const existingUserDeck = {
			playerId: 'player-1',
			decks: [],
		};
		const state = {
			userDecks: [existingUserDeck],
		};
		const result = ensureUserDecks(state, 'player-1', [
			{
				deckDataId: '99a0f7ee-367a-402a-a751-854e8aa07104',
				deckName: 'default deck',
				deckNo: 1,
				generationsId: 105,
				aceCard: '',
				deckCardsList: [],
			},
		]);
		expect(result).toEqual({
			value: existingUserDeck,
			created: false,
		});
		expect(result.value.decks).toHaveLength(0);
	});

	test('creates a user deck state from cloned defaults once', () => {
		const state: { userDecks: UserDeckState[] } = { userDecks: [] };
		const defaultDecks = [
			{
				deckDataId: '99a0f7ee-367a-402a-a751-854e8aa07104',
				deckName: 'default deck',
				deckNo: 1,
				generationsId: 105,
				aceCard: '',
				deckCardsList: [],
			},
		];

		const result = ensureUserDecks(state, 'player-1', defaultDecks);

		expect(result.created).toBe(true);
		expect(result.value).toEqual({
			playerId: 'player-1',
			decks: defaultDecks,
		});
		expect(result.value.decks).not.toBe(defaultDecks);
		expect(state.userDecks).toEqual([result.value]);
	});

	test('hides card references absent from the selected master without changing canonical state', () => {
		const canonical = createDeckState('new-card');
		const before = structuredClone(canonical);

		const projected = projectUserDecks(canonical, new Set());

		expect(projected.decks[0]?.aceCard).toBe('');
		expect(projected.decks[0]?.deckCardsList[0]).toEqual({
			d_deck_cards_id: 'deck-card-1',
			slot_no: 1,
		});
		expect(canonical).toEqual(before);
	});

	test('preserves a hidden canonical reference when an older projection posts an empty slot', () => {
		const canonical = createDeckState('new-card');

		const modified = modifyUserDeckList(
			canonical,
			createModifyBody('', ''),
			new Set(),
		);

		expect(modified?.[0]?.aceCard).toBe('new-card');
		expect(modified?.[0]?.deckCardsList[0]).toMatchObject({
			d_card_datas_id: 'new-card',
		});
	});

	test('hidden reference mergeは非表示canonicalだけを空入力から復元する', () => {
		expect(mergeDeckCardReference('', 'hidden-card', new Set())).toBe(
			'hidden-card',
		);
		expect(
			mergeDeckCardReference('', 'visible-card', new Set(['visible-card'])),
		).toBe('');
		expect(
			mergeDeckCardReference('hidden-card', '', new Set(['visible-card'])),
		).toBeUndefined();
	});

	test('allows clearing a visible reference and rejects an invisible replacement', () => {
		const canonical = createDeckState('visible-card');
		const visibleCardDataIds = new Set(['visible-card']);

		const cleared = modifyUserDeckList(
			canonical,
			createModifyBody('', ''),
			visibleCardDataIds,
		);

		expect(cleared?.[0]?.aceCard).toBe('');
		expect(cleared?.[0]?.deckCardsList[0]).toEqual({
			d_deck_cards_id: 'deck-card-1',
			slot_no: 1,
		});
		expect(
			modifyUserDeckList(
				canonical,
				createModifyBody('invisible-card', 'invisible-card'),
				visibleCardDataIds,
			),
		).toBeUndefined();
	});
});

function createDeckState(cardDataId: string): UserDeckState {
	return {
		playerId: 'player-1',
		decks: [
			{
				deckDataId: 'deck-1',
				deckName: 'deck',
				deckNo: 1,
				generationsId: 105,
				aceCard: cardDataId,
				deckCardsList: [
					{
						d_deck_cards_id: 'deck-card-1',
						slot_no: 1,
						d_card_datas_id: cardDataId,
					},
				],
			},
		],
	};
}

function createModifyBody(aceCard: string, cardDataId: string): object {
	return {
		modify_deck_list: [
			{
				d_deck_datas_id: 'deck-1',
				deck_name: 'deck',
				deck_no: 1,
				generations_id: 105,
				ace_card: aceCard,
				deck_cards_list: [
					{
						d_deck_cards_id: 'deck-card-1',
						slot_no: 1,
						d_card_datas_id: cardDataId,
					},
				],
			},
		],
	};
}
