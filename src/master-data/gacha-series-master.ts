import type { Database } from 'bun:sqlite';
import {
	getGachaSeriesTimeLimitEndTime,
	isGachaSeriesOpen,
} from '../application/gacha-series-summary.ts';
import type { GachaGuaranteeExchangeRate } from '../state/gacha-definition.ts';
import { getGachaGuaranteeExchangeRatesBySeriesIds } from './gacha-guarantee-master.ts';
import { appendMapArrayValue } from './map-array.ts';
import { currentUtcIsoDateTime } from './master-time.ts';
import { sqlInPlaceholders } from './sql-placeholders.ts';

export type GachaSeriesSummaryMaster = {
	gachaSeriesId: number;
	title: string;
	gachaType: number;
	isPartyGacha: boolean;
	cardList: number[];
	cardCount: number;
	guaranteeExchangeRateList: GachaGuaranteeExchangeRate[];
	guaranteeExchangeRateCount: number;
	isSingleEnable: boolean;
	isConsectiveEnable: boolean;
	isPaidEnable: boolean;
	isCurrentlyOpen: boolean;
	startTime: string;
	endTime: string;
	timeLimitGachaEndTime: string | null;
};

type GachaSeriesSummaryRow = {
	id: number;
	gacha_series_name: string;
	gacha_type: number;
	gacha_time_limit_type: number;
	available_time: number;
	title: string;
	start_time: string;
	end_time: string;
};

type WebviewGachaCardRow = {
	gacha_series_id: number;
	card_datas_id: number;
	sort_key: number;
};

const partyGachaTypes = new Set([7, 8]);
const ticketOnlyGachaTypes = new Set([90, 91, 92, 93]);

export function getGachaSeriesAdminSummaryFromDatabase(
	database: Database,
): GachaSeriesSummaryMaster[] {
	const now = currentUtcIsoDateTime();
	const seriesRows = database
		.query<GachaSeriesSummaryRow, []>(
			'SELECT s.id, s.gacha_series_name, s.gacha_type, s.gacha_time_limit_type, s.available_time, d.title, s.start_time, s.end_time FROM master_gacha_series s JOIN top_webview_gacha_detail d ON d.gacha_series_id = s.id ORDER BY datetime(s.start_time) DESC, s.order_id, s.id',
		)
		.all();
	const seriesIds = seriesRows.map((row) => row.id);
	const cardsBySeries = getWebviewGachaCardIdsBySeriesIds(database, seriesIds);
	const ratesBySeries = getGachaGuaranteeExchangeRatesBySeriesIds(
		database,
		seriesIds,
	);
	return seriesRows.map((row) => {
		const cardList = cardsBySeries.get(row.id) ?? [];
		const guaranteeExchangeRateList = ratesBySeries.get(row.id) ?? [];
		return {
			gachaSeriesId: row.id,
			title: row.title,
			gachaType: row.gacha_type,
			isPartyGacha: isPartyGacha(row),
			cardList,
			cardCount: cardList.length,
			guaranteeExchangeRateList,
			guaranteeExchangeRateCount: guaranteeExchangeRateList.length,
			isSingleEnable: true,
			isConsectiveEnable: true,
			isPaidEnable: !ticketOnlyGachaTypes.has(row.gacha_type),
			isCurrentlyOpen: isGachaSeriesOpen(toSchedule(row), now),
			startTime: row.start_time,
			endTime: row.end_time,
			timeLimitGachaEndTime: getGachaSeriesTimeLimitEndTime(
				toSchedule(row),
				now,
			),
		};
	});
}

function isPartyGacha(row: GachaSeriesSummaryRow): boolean {
	return (
		partyGachaTypes.has(row.gacha_type) ||
		row.title.includes('PARTY!') ||
		row.gacha_series_name.includes('PARTY!')
	);
}

function toSchedule(row: GachaSeriesSummaryRow) {
	return {
		startTime: row.start_time,
		endTime: row.end_time,
		timeLimitType: row.gacha_time_limit_type,
		availableTimeHours: row.available_time,
	};
}

function getWebviewGachaCardIdsBySeriesIds(
	database: Database,
	gachaSeriesIds: readonly number[],
): Map<number, number[]> {
	const uniqueSeriesIds = [...new Set(gachaSeriesIds)].filter((gachaSeriesId) =>
		Number.isSafeInteger(gachaSeriesId),
	);
	if (uniqueSeriesIds.length === 0) {
		return new Map();
	}
	const rows = database
		.query<WebviewGachaCardRow, number[]>(
			`SELECT gacha_series_id, resolved_card_datas_id AS card_datas_id, MIN(rate_index * 100000 + card_index) AS sort_key FROM top_webview_gacha_rate_card WHERE gacha_series_id IN (${sqlInPlaceholders(uniqueSeriesIds)}) GROUP BY gacha_series_id, resolved_card_datas_id ORDER BY gacha_series_id, sort_key`,
		)
		.all(...uniqueSeriesIds);
	const cardsBySeries = new Map<number, number[]>();
	for (const row of rows) {
		appendMapArrayValue(cardsBySeries, row.gacha_series_id, row.card_datas_id);
	}
	return cardsBySeries;
}
