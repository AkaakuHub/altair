import type { Database } from 'bun:sqlite';

type CardGrowthRow = {
	card_series_id: number;
	experience_type: number;
};

export type CardEvolutionRow = {
	card_series_id: number;
	evolve_times: number;
};

export function getCardGrowthRow(
	database: Database,
	cardDatasId: number,
): CardGrowthRow | undefined {
	const row = database
		.query(
			[
				'SELECT card_series_id, experience_type',
				'FROM master_card_datas',
				'WHERE id = ?',
			].join(' '),
		)
		.get(cardDatasId) as CardGrowthRow | null;
	return row ?? undefined;
}

export function getCardEvolutionRow(
	database: Database,
	cardDatasId: number,
): CardEvolutionRow | undefined {
	const row = database
		.query(
			[
				'SELECT card_series_id, evolve_times',
				'FROM master_card_datas',
				'WHERE id = ?',
			].join(' '),
		)
		.get(cardDatasId) as CardEvolutionRow | null;
	return row ?? undefined;
}
