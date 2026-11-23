import type { Database } from 'bun:sqlite';

export type CollectionCharacterRow = {
	id: number;
	name_last: string;
	name_first: string;
	latin_alphabet_name_last: string;
	latin_alphabet_name_first: string;
	character_voice: string;
	theme_color: string;
	contained_characters: string | null;
};

export type CollectionCardDataRow = {
	id: number;
	card_series_id: number;
	characters_id: number;
	evolve_times: number;
};

export type CollectionStyleMovieRow = {
	id: number;
	card_series_id: number;
	movie_type: number;
};

export type CollectionStyleVoiceRow = {
	id: number;
	card_series_id: number;
	priority: number;
};

export type CollectionCharacterMasterRows = {
	characters: CollectionCharacterRow[];
	cards: CollectionCardDataRow[];
	movies: CollectionStyleMovieRow[];
	voices: CollectionStyleVoiceRow[];
};

export function queryCollectionCharacterMasterRows(
	database: Database,
): CollectionCharacterMasterRows {
	return {
		characters: database
			.query<CollectionCharacterRow, []>(
				[
					'SELECT id, name_last, name_first, latin_alphabet_name_last,',
					'latin_alphabet_name_first, character_voice, theme_color, contained_characters',
					'FROM master_characters',
					'ORDER BY id',
				].join(' '),
			)
			.all(),
		cards: database
			.query<CollectionCardDataRow, []>(
				[
					'SELECT id, card_series_id, characters_id, evolve_times',
					'FROM master_card_datas',
					'ORDER BY id',
				].join(' '),
			)
			.all(),
		movies: database
			.query<CollectionStyleMovieRow, []>(
				[
					'SELECT id, card_series_id, movie_type',
					'FROM master_style_movies',
					'ORDER BY card_series_id, movie_type',
				].join(' '),
			)
			.all(),
		voices: database
			.query<CollectionStyleVoiceRow, []>(
				[
					'SELECT id, card_series_id, priority',
					'FROM master_style_voices',
					'ORDER BY card_series_id, priority',
				].join(' '),
			)
			.all(),
	};
}
