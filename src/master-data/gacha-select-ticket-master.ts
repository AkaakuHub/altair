import type { Database } from 'bun:sqlite';
import type { GachaSelectTicketExchangeRate } from '../state/gacha-definition.ts';
import {
	findSelectTicketExchangeRate,
	findSelectTicketSeries,
	getSelectTicketSeriesRows,
} from './gacha-master-queries.ts';
import { mapGachaSelectTicketExchangeRate } from './gacha-master-row-mappers.ts';

export type SelectTicketSeriesExchangeTicketMaster = {
	selectTicketSeriesId: number;
	exchangeTicketId: number;
	startTime: string;
	endTime: string;
};

export function getGachaSelectTicketExchangeRateByIdFromDatabase(
	database: Database,
	selectTicketExchangeRateId: number,
): GachaSelectTicketExchangeRate | undefined {
	const row = findSelectTicketExchangeRate(
		database,
		selectTicketExchangeRateId,
	);
	return row === null ? undefined : mapGachaSelectTicketExchangeRate(row);
}

export function getSelectTicketSeriesExchangeTicketsFromDatabase(
	database: Database,
): SelectTicketSeriesExchangeTicketMaster[] {
	return getSelectTicketSeriesRows(database).map((row) => ({
		selectTicketSeriesId: row.id,
		exchangeTicketId: row.exchange_ticket_id,
		startTime: row.start_time,
		endTime: row.end_time,
	}));
}

export function getSelectTicketExchangeTicketItemIdBySeriesIdFromDatabase(
	database: Database,
	selectTicketSeriesId: number,
): number | undefined {
	return findSelectTicketSeries(database, selectTicketSeriesId)
		?.exchange_ticket_id;
}
