import type {
	CollectionCardDataRow,
	CollectionCharacterMasterRows,
	CollectionCharacterRow,
	CollectionStyleMovieRow,
	CollectionStyleVoiceRow,
} from './collection-character-master-query.ts';
import { parseCommaSeparatedIntegerList } from './json-utils.ts';
export type CollectionCharacterCard = {
	card_datas_id: number;
	voice_list: { voices_id: number; priority: number; is_opened: boolean }[];
	movie_list: { movies_id: number; priority: number; is_opened: boolean }[];
};

export type CollectionCharacterReadModel = {
	characterId: number;
	nameLast: string;
	nameFirst: string;
	latinAlphabetNameLast: string;
	latinAlphabetNameFirst: string;
	characterVoice: string;
	themeColor: string;
	cards: CollectionCharacterCard[];
};

const observedExtraCardSourceByCharacter = new Map<number, readonly number[]>([
	[1052, [1053]],
	[1054, [1053]],
]);

const mergedCharacterTargets = new Map<number, number>([
	[1020, 1021],
	[1030, 1031],
	[1044, 1051],
	[1040, 1041],
	[1050, 1051],
]);

export function createCollectionCharacterReadModels(
	rows: CollectionCharacterMasterRows,
): Map<number, CollectionCharacterReadModel> {
	const characterById = new Map(
		rows.characters.map((character) => [character.id, character]),
	);
	const moviesBySeries = groupByCardSeries(rows.movies);
	const voicesBySeries = groupByCardSeries(rows.voices);
	const cardSeriesMaxByCharacter = new Map<
		number,
		Map<number, CollectionCardDataRow>
	>();
	const cardSeriesMinByCharacter = new Map<
		number,
		Map<number, CollectionCardDataRow>
	>();
	for (const card of rows.cards) {
		putCardBySeries(
			cardSeriesMaxByCharacter,
			card,
			(current) => card.id > current.id,
		);
		putCardBySeries(
			cardSeriesMinByCharacter,
			card,
			(current) => card.id < current.id,
		);
	}

	const result = new Map<number, CollectionCharacterReadModel>();
	for (const [characterId, character] of characterById) {
		const cardsBySeries = cardSeriesMaxByCharacter.get(characterId);
		if (!cardsBySeries || isSourceOnlyCharacter(character)) {
			continue;
		}
		result.set(
			characterId,
			createCharacterReadModel(
				character,
				createCardReadModels(cardsBySeries, moviesBySeries, voicesBySeries),
			),
		);
	}

	for (const [destinationId, sourceIds] of observedExtraCardSourceByCharacter) {
		let destination = result.get(destinationId);
		if (!destination) {
			const character = characterById.get(destinationId);
			if (!character) {
				throw new Error(`extra card destination not found: ${destinationId}`);
			}
			destination = createCharacterReadModel(character, []);
			result.set(destinationId, destination);
		}
		for (const sourceId of sourceIds) {
			const sourceCardsBySeries = cardSeriesMinByCharacter.get(sourceId);
			if (!sourceCardsBySeries) {
				throw new Error(`extra card source not found: ${sourceId}`);
			}
			destination.cards.push(
				...createCardReadModels(
					sourceCardsBySeries,
					moviesBySeries,
					voicesBySeries,
				),
			);
		}
	}

	for (const [sourceId, destinationId] of mergedCharacterTargets) {
		const source = result.get(sourceId);
		if (!source) {
			continue;
		}
		const destination = result.get(destinationId);
		if (destination) {
			destination.cards.push(...source.cards);
		}
		result.delete(sourceId);
	}
	return result;
}

function putCardBySeries(
	target: Map<number, Map<number, CollectionCardDataRow>>,
	card: CollectionCardDataRow,
	shouldReplace: (current: CollectionCardDataRow) => boolean,
): void {
	let cardsBySeries = target.get(card.characters_id);
	if (!cardsBySeries) {
		cardsBySeries = new Map();
		target.set(card.characters_id, cardsBySeries);
	}
	const current = cardsBySeries.get(card.card_series_id);
	if (!current || shouldReplace(current)) {
		cardsBySeries.set(card.card_series_id, card);
	}
}

function groupByCardSeries<T extends { card_series_id: number }>(
	rows: T[],
): Map<number, T[]> {
	const grouped = new Map<number, T[]>();
	for (const row of rows) {
		grouped.set(row.card_series_id, [
			...(grouped.get(row.card_series_id) ?? []),
			row,
		]);
	}
	return grouped;
}

function isSourceOnlyCharacter(character: CollectionCharacterRow): boolean {
	return (
		parseCommaSeparatedIntegerList(character.contained_characters).length > 0 &&
		character.name_last.length === 0 &&
		character.name_first.length === 0 &&
		character.latin_alphabet_name_last.length === 0 &&
		character.latin_alphabet_name_first.length === 0
	);
}

function createCharacterReadModel(
	character: CollectionCharacterRow,
	cards: CollectionCharacterCard[],
): CollectionCharacterReadModel {
	return {
		characterId: character.id,
		nameLast: character.name_last,
		nameFirst: character.name_first,
		latinAlphabetNameLast: character.latin_alphabet_name_last,
		latinAlphabetNameFirst: character.latin_alphabet_name_first,
		characterVoice: character.character_voice,
		themeColor: character.theme_color,
		cards,
	};
}

function createCardReadModels(
	cardsBySeries: Map<number, CollectionCardDataRow>,
	moviesBySeries: Map<number, CollectionStyleMovieRow[]>,
	voicesBySeries: Map<number, CollectionStyleVoiceRow[]>,
): CollectionCharacterCard[] {
	return [...cardsBySeries.entries()]
		.sort(([leftSeriesId], [rightSeriesId]) => leftSeriesId - rightSeriesId)
		.map(([, card]) => ({
			card_datas_id: card.id,
			voice_list: (voicesBySeries.get(card.card_series_id) ?? []).map(
				(voice) => ({
					voices_id: voice.id,
					priority: voice.priority,
					is_opened: true,
				}),
			),
			movie_list: (moviesBySeries.get(card.card_series_id) ?? []).map(
				(movie) => ({
					movies_id: movie.id,
					priority: 1,
					is_opened: movie.movie_type - 1 <= card.evolve_times,
				}),
			),
		}));
}
