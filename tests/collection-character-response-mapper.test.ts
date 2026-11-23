import { describe, expect, test } from 'bun:test';
import { createCollectionCharacterReadModels } from '../src/v1/active-master-database/collection-character-read-model.ts';
import { createCollectionCharacterStoredResponse } from '../src/v1/active-master-database/collection-character-response-mapper.ts';

describe('collection character response mapping', () => {
	test('card seriesの最新cardとevolve timesから公式responseを作る', () => {
		const characters = createCollectionCharacterReadModels({
			characters: [
				createCharacter(1001),
				createCharacter(1052),
				createCharacter(1053),
				createCharacter(1054),
			],
			cards: [
				{ id: 10, card_series_id: 20, characters_id: 1001, evolve_times: 0 },
				{ id: 11, card_series_id: 20, characters_id: 1001, evolve_times: 1 },
				{ id: 12, card_series_id: 21, characters_id: 1053, evolve_times: 0 },
			],
			movies: [
				{ id: 30, card_series_id: 20, movie_type: 1 },
				{ id: 31, card_series_id: 20, movie_type: 3 },
			],
			voices: [{ id: 40, card_series_id: 20, priority: 2 }],
		});

		expect(createCollectionCharacterStoredResponse(1001, characters)).toEqual({
			body: {
				collection_character_info: {
					character_id: 1001,
					name_last: 'Last',
					name_first: 'First',
					latin_alphabet_name_last: 'LAST',
					latin_alphabet_name_first: 'FIRST',
					character_voice: 'Voice',
					theme_color: '#ffffff',
					card_list: [
						{
							card_datas_id: 11,
							voice_list: [{ voices_id: 40, priority: 2, is_opened: true }],
							movie_list: [
								{ movies_id: 30, priority: 1, is_opened: true },
								{ movies_id: 31, priority: 1, is_opened: false },
							],
						},
					],
				},
			},
			statusCode: 200,
		});
	});

	test('不正または存在しないcharacter identityはresponseを作らない', () => {
		const characters = new Map();
		expect(
			createCollectionCharacterStoredResponse(0, characters),
		).toBeUndefined();
		expect(
			createCollectionCharacterStoredResponse(1001, characters),
		).toBeUndefined();
	});
});

function createCharacter(id: number) {
	return {
		id,
		name_last: 'Last',
		name_first: 'First',
		latin_alphabet_name_last: 'LAST',
		latin_alphabet_name_first: 'FIRST',
		character_voice: 'Voice',
		theme_color: '#ffffff',
		contained_characters: null,
	};
}
