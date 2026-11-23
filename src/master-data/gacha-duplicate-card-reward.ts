import type { Database } from 'bun:sqlite';
import type { DuplicateCardReward } from '../state/gacha-definition.ts';

type DuplicateCardRewardRow = {
	rarity: number;
	petal_coin_quantity: number;
	cost_items_id: number;
	cost_num: number;
};

type ExchangeDuplicateCardRewardRow = {
	petal_coin_quantity: number;
	limit_break_material_id: number;
	limit_break_material_quantity: number;
};

const partyCardRarityThreshold = 90;

export function getDuplicateCardRewardFromDatabase(
	database: Database,
	cardDatasId: number,
): DuplicateCardReward | undefined {
	const row = readDuplicateCardRewardRow(database, cardDatasId);
	if (!row) {
		return undefined;
	}
	return {
		coinNum: row.petal_coin_quantity,
		materialLimitBreakItemId: row.cost_items_id,
		materialLimitBreakNum:
			row.rarity >= partyCardRarityThreshold ? row.cost_num : row.cost_num / 5,
	};
}

export function hasOfficialGachaCardRewardFromDatabase(
	database: Database,
	cardDatasId: number,
): boolean {
	return readDuplicateCardRewardRow(database, cardDatasId) !== undefined;
}

export function getExchangeDuplicateCardRewardFromDatabase(
	database: Database,
	cardDatasId: number,
): DuplicateCardReward | undefined {
	const row = readExchangeDuplicateCardRewardRow(database, cardDatasId);
	if (!row) {
		return undefined;
	}
	return {
		coinNum: row.petal_coin_quantity,
		materialLimitBreakItemId: row.limit_break_material_id,
		materialLimitBreakNum: row.limit_break_material_quantity,
	};
}

function readDuplicateCardRewardRow(
	database: Database,
	cardDatasId: number,
): DuplicateCardRewardRow | undefined {
	return (
		database
			.query<DuplicateCardRewardRow, [number]>(
				[
					'SELECT card.rarity, petal.petal_coin_quantity, material.cost_items_id, material.cost_num',
					'FROM master_card_datas card',
					'JOIN master_card_limit_break_materials material',
					'ON material.card_series_id = card.card_series_id',
					'AND material.limit_break_times = 1',
					'JOIN master_petal_coin_exchange_rate petal',
					'ON petal.rarity = card.rarity',
					'WHERE card.id = ?',
				].join(' '),
			)
			.get(cardDatasId) ?? undefined
	);
}

function readExchangeDuplicateCardRewardRow(
	database: Database,
	cardDatasId: number,
): ExchangeDuplicateCardRewardRow | undefined {
	return (
		database
			.query<ExchangeDuplicateCardRewardRow, [number]>(
				[
					'SELECT petal.petal_coin_quantity, rate.limit_break_material_id,',
					'rate.limit_break_material_quantity',
					'FROM master_card_datas card',
					'JOIN master_limit_break_material_rate rate',
					'ON rate.card_series_id = card.card_series_id',
					'JOIN master_petal_coin_exchange_rate petal',
					'ON petal.rarity = card.rarity',
					'WHERE card.id = ?',
				].join(' '),
			)
			.get(cardDatasId) ?? undefined
	);
}
