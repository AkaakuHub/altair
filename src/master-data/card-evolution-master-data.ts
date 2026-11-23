import type { Database } from 'bun:sqlite';
import type { CardEvolutionRequirement } from '../application/card-growth/card-growth-master-source.ts';
import {
	type CardEvolutionRow,
	getCardEvolutionRow,
} from './card-growth-card-data.ts';
import {
	type CardEvolutionMaterialRow,
	getEvolutionValue,
	mapCardEvolutionRequirement,
} from './card-growth-row-mappers.ts';

type CardSeriesEvolutionRow = {
	evolution0_id: number;
	evolution1_id: number;
	evolution2_id: number;
	evolution3_id: number;
	evolution4_id: number;
};

type CardMaxStyleLevelRow = {
	evolve_times: number;
	evolution0_max_level: number;
	evolution1_max_level: number;
	evolution2_max_level: number;
	evolution3_max_level: number;
	evolution4_max_level: number;
};

export function getEvolutionRequirement(
	database: Database,
	cardDatasId: number,
): CardEvolutionRequirement | 'maxEvolution' | undefined {
	const card = getCardEvolutionRow(database, cardDatasId);
	if (!card) {
		return undefined;
	}
	const nextCardDatasId = getNextEvolutionCardDatasId(database, card);
	if (nextCardDatasId === undefined) {
		return 'maxEvolution';
	}
	const nextMaxStyleLevel = getCardMaxStyleLevel(database, nextCardDatasId);
	if (nextMaxStyleLevel === undefined) {
		return undefined;
	}
	const row = database
		.query(
			[
				'SELECT cost_items_id1, cost_num1, cost_items_id2, cost_num2, cost_items_id3, cost_num3',
				'FROM master_card_evolution_materials',
				'WHERE id = ?',
			].join(' '),
		)
		.get(nextCardDatasId) as CardEvolutionMaterialRow | null;
	if (!row) {
		return undefined;
	}
	return mapCardEvolutionRequirement(nextCardDatasId, nextMaxStyleLevel, row);
}

function getCardMaxStyleLevel(
	database: Database,
	cardDatasId: number,
): number | undefined {
	const row = database
		.query(
			[
				'SELECT d.evolve_times, r.evolution0_max_level, r.evolution1_max_level,',
				'r.evolution2_max_level, r.evolution3_max_level, r.evolution4_max_level',
				'FROM master_card_datas d',
				'JOIN master_card_rarities r ON r.id = d.rarity',
				'WHERE d.id = ?',
			].join(' '),
		)
		.get(cardDatasId) as CardMaxStyleLevelRow | null;
	if (!row) {
		return undefined;
	}
	return getEvolutionValue(
		[
			row.evolution0_max_level,
			row.evolution1_max_level,
			row.evolution2_max_level,
			row.evolution3_max_level,
			row.evolution4_max_level,
		],
		row.evolve_times,
	);
}

function getNextEvolutionCardDatasId(
	database: Database,
	card: CardEvolutionRow,
): number | undefined {
	if (card.evolve_times >= 4) {
		return undefined;
	}
	const row = database
		.query(
			[
				'SELECT evolution0_id, evolution1_id, evolution2_id, evolution3_id, evolution4_id',
				'FROM master_card_series',
				'WHERE id = ?',
			].join(' '),
		)
		.get(card.card_series_id) as CardSeriesEvolutionRow | null;
	if (!row) {
		return undefined;
	}
	return getEvolutionValue(
		[
			row.evolution0_id,
			row.evolution1_id,
			row.evolution2_id,
			row.evolution3_id,
			row.evolution4_id,
		],
		card.evolve_times + 1,
	);
}
