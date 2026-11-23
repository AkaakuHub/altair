import type { Database } from 'bun:sqlite';
import type {
	ExchangePointRateDetailRow,
	SelectTicketExchangeRateRow,
} from './gacha-master-row-mappers.ts';
import { sqlInPlaceholders } from './sql-placeholders.ts';

type ExchangePointRatePeriodRow = { start_time: string; end_time: string };
type SelectTicketSeriesRow = {
	id: number;
	exchange_ticket_id: number;
	start_time: string;
	end_time: string;
};
type ExchangeCardRow = {
	card_datas_id: number;
	card_name: string;
	card_rarity: string;
};

export function findGachaExchangePointId(database: Database, seriesId: number) {
	return database
		.query<{ gacha_exchange_point_id: number }, [number]>(
			'SELECT gacha_exchange_point_id FROM master_gacha_series WHERE id = ?',
		)
		.get(seriesId);
}

export function getExchangePointRateIds(database: Database, seriesId: number) {
	return database
		.query<{ id: number }, [number]>(
			'SELECT id FROM master_exchange_point_rate WHERE gacha_series_id = ? ORDER BY id',
		)
		.all(seriesId);
}

export function getExchangePointRatePeriods(
	database: Database,
	seriesId: number,
) {
	return database
		.query<ExchangePointRatePeriodRow, [number]>(
			'SELECT start_time, end_time FROM master_exchange_point_rate WHERE gacha_series_id = ? ORDER BY datetime(start_time), id',
		)
		.all(seriesId);
}

export function findExchangePointRate(database: Database, rateId: number) {
	return database
		.query<ExchangePointRateDetailRow, [number]>(
			exchangePointRateSelect('WHERE id = ?'),
		)
		.get(rateId);
}

export function getExchangePointRates(
	database: Database,
	seriesIds: readonly number[],
) {
	return database
		.query<ExchangePointRateDetailRow, number[]>(
			exchangePointRateSelect(
				`WHERE gacha_series_id IN (${sqlInPlaceholders(seriesIds)}) ORDER BY gacha_series_id, id`,
			),
		)
		.all(...seriesIds);
}

export function findSelectTicketExchangeRate(
	database: Database,
	rateId: number,
) {
	return database
		.query<SelectTicketExchangeRateRow, [number]>(
			'SELECT id, select_ticket_series_id, exchange_item_type, exchange_item_id, exchange_item_quantity FROM master_select_ticket_exchange_rate WHERE id = ?',
		)
		.get(rateId);
}

export function getSelectTicketSeriesRows(database: Database) {
	return database
		.query<SelectTicketSeriesRow, []>(
			'SELECT id, exchange_ticket_id, start_time, end_time FROM master_select_ticket_series WHERE exchange_ticket_id > 0 ORDER BY id',
		)
		.all();
}

export function findSelectTicketSeries(database: Database, seriesId: number) {
	return database
		.query<{ exchange_ticket_id: number }, [number]>(
			'SELECT exchange_ticket_id FROM master_select_ticket_series WHERE id = ? AND exchange_ticket_id > 0',
		)
		.get(seriesId);
}

export function getExchangeCardRows(
	database: Database,
	seriesIds: readonly number[],
) {
	return database
		.query<ExchangeCardRow, number[]>(
			[
				'SELECT r.exchange_item_id AS card_datas_id, d.name AS card_name, rarity.rarity_name AS card_rarity',
				'FROM master_select_ticket_exchange_rate r JOIN master_card_datas d ON d.id = r.exchange_item_id',
				'JOIN master_card_rarities rarity ON rarity.id = d.rarity',
				`WHERE r.select_ticket_series_id IN (${sqlInPlaceholders(seriesIds)}) AND r.exchange_item_type = 2 ORDER BY r.id`,
			].join(' '),
		)
		.all(...seriesIds);
}

function exchangePointRateSelect(suffix: string): string {
	return `SELECT id, exchange_point_id, exchange_item_type, exchange_item_id, exchange_item_quantity, exchange_price, limited_count, gacha_series_id FROM master_exchange_point_rate ${suffix}`;
}
