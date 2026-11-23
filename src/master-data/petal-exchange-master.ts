import type { Database } from 'bun:sqlite';
import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import { sqlInPlaceholders } from './sql-placeholders.ts';

export type PetalExchangeCardMaster = {
	cardDatasId: number;
	cardSeriesId: number;
	characterId: number;
	materialItemId: number;
	rarity: number;
};

export function getPetalExchangeIdentityFingerprint(
	master: PetalExchangeCardMaster,
): EntityIdentityFingerprint {
	return {
		domain: 'petal-card-exchange',
		value: JSON.stringify([
			master.cardSeriesId,
			master.characterId,
			master.materialItemId,
			master.rarity,
		]),
	};
}

type PetalExchangeCardRow = {
	id: number;
	card_series_id: number;
	characters_id: number;
	cost_items_id: number;
	rarity: number;
};

export function getPetalExchangeCardsFromDatabase(
	database: Database,
	cardDatasIds: readonly number[],
): Map<number, PetalExchangeCardMaster> {
	const uniqueCardDatasIds = [...new Set(cardDatasIds)];
	if (uniqueCardDatasIds.length === 0) {
		return new Map();
	}
	const rows = database
		.query<PetalExchangeCardRow, number[]>(
			[
				'SELECT card.id, card.card_series_id, card.characters_id, card.rarity,',
				'material.cost_items_id',
				'FROM master_card_datas card',
				'JOIN master_card_limit_break_materials material',
				'ON material.card_series_id = card.card_series_id',
				'AND material.limit_break_times = 1',
				'WHERE card.id IN',
				`(${sqlInPlaceholders(uniqueCardDatasIds)})`,
				'AND EXISTS (',
				'SELECT 1',
				'FROM master_petal_exchange_rates rate',
				'WHERE rate.rarity = card.rarity',
				')',
			].join(' '),
		)
		.all(...uniqueCardDatasIds);
	return new Map(
		rows.map((row) => [
			row.id,
			{
				cardDatasId: row.id,
				cardSeriesId: row.card_series_id,
				characterId: row.characters_id,
				materialItemId: row.cost_items_id,
				rarity: row.rarity,
			},
		]),
	);
}

export function getPetalExchangeCardBySeriesIdFromDatabase(
	database: Database,
	cardSeriesId: number,
): PetalExchangeCardMaster | undefined {
	const row = database
		.query<PetalExchangeCardRow, [number]>(
			[
				'SELECT card.id, card.card_series_id, card.characters_id, card.rarity,',
				'material.cost_items_id',
				'FROM master_card_datas card',
				'JOIN master_card_limit_break_materials material',
				'ON material.card_series_id = card.card_series_id',
				'AND material.limit_break_times = 1',
				'WHERE card.card_series_id = ?',
				'AND EXISTS (',
				'SELECT 1',
				'FROM master_petal_exchange_rates rate',
				'WHERE rate.rarity = card.rarity',
				')',
				'ORDER BY card.id',
				'LIMIT 1',
			].join(' '),
		)
		.get(cardSeriesId);
	if (!row) {
		return undefined;
	}
	return {
		cardDatasId: row.id,
		cardSeriesId: row.card_series_id,
		characterId: row.characters_id,
		materialItemId: row.cost_items_id,
		rarity: row.rarity,
	};
}

export function calculatePetalExchangeCostFromDatabase(
	database: Database,
	rarity: number,
	currentTotalNum: number,
	purchaseNum: number,
): number | undefined {
	if (currentTotalNum < 0 || purchaseNum <= 0) {
		return undefined;
	}
	const rates = database
		.query<
			{
				price: number;
				exchange_limit_lower: number;
				exchange_limit_upper: number;
			},
			[number]
		>(
			[
				'SELECT price, exchange_limit_lower, exchange_limit_upper',
				'FROM master_petal_exchange_rates',
				'WHERE rarity = ?',
				'ORDER BY exchange_limit_lower',
			].join(' '),
		)
		.all(rarity);
	if (rates.length === 0) {
		return undefined;
	}
	let cost = 0;
	for (
		let exchangeIndex = currentTotalNum + 1;
		exchangeIndex <= currentTotalNum + purchaseNum;
		exchangeIndex += 1
	) {
		const rate = rates.find(
			(candidate) =>
				candidate.exchange_limit_lower <= exchangeIndex &&
				exchangeIndex <= candidate.exchange_limit_upper,
		);
		if (!rate) {
			return undefined;
		}
		cost += rate.price;
	}
	return cost;
}
