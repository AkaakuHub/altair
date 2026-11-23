import type { Database } from 'bun:sqlite';
import type { GachaGuaranteeExchangeRate } from '../state/gacha-definition.ts';
import {
	findExchangePointRate,
	findGachaExchangePointId,
	getExchangePointRateIds,
	getExchangePointRatePeriods,
	getExchangePointRates,
} from './gacha-master-queries.ts';
import { mapGachaGuaranteeExchangeRate } from './gacha-master-row-mappers.ts';
import { appendMapArrayValue } from './map-array.ts';

type GachaGuaranteeExchangeItemMaster = {
	exchangePointRateId: number;
	isHaving: boolean;
	remainingExchangeNum: number;
};

export function getGachaExchangePointIdBySeriesIdFromDatabase(
	database: Database,
	gachaSeriesId: number,
): number | undefined {
	const exchangePointId =
		findGachaExchangePointId(database, gachaSeriesId)
			?.gacha_exchange_point_id ?? 0;
	return exchangePointId > 0 ? exchangePointId : undefined;
}

export function getGachaGuaranteeExchangeItemsBySeriesIdFromDatabase(
	database: Database,
	gachaSeriesId: number,
): GachaGuaranteeExchangeItemMaster[] {
	return getExchangePointRateIds(database, gachaSeriesId).map((row) => ({
		exchangePointRateId: row.id,
		isHaving: false,
		remainingExchangeNum: -1,
	}));
}

export function getGachaGuaranteeExchangeHeaderDateBySeriesIdFromDatabase(
	database: Database,
	gachaSeriesId: number,
	currentDate: Date,
): Date | undefined {
	for (const row of getExchangePointRatePeriods(database, gachaSeriesId)) {
		const startTime = new Date(row.start_time).getTime();
		const endTime = new Date(row.end_time).getTime();
		const currentTime = currentDate.getTime();
		if (startTime <= currentTime && currentTime < endTime) return currentDate;
		if (Number.isFinite(startTime) && startTime < endTime)
			return new Date(startTime + 1000);
	}
	return undefined;
}

export function getGachaGuaranteeExchangeRateByIdFromDatabase(
	database: Database,
	exchangePointRateId: number,
): GachaGuaranteeExchangeRate | undefined {
	const row = findExchangePointRate(database, exchangePointRateId);
	return row === null ? undefined : mapGachaGuaranteeExchangeRate(row);
}

export function getGachaGuaranteeExchangeRatesBySeriesIds(
	database: Database,
	gachaSeriesIds: readonly number[],
): Map<number, GachaGuaranteeExchangeRate[]> {
	const uniqueSeriesIds = uniqueSafeIntegers(gachaSeriesIds);
	if (uniqueSeriesIds.length === 0) return new Map();
	const ratesBySeries = new Map<number, GachaGuaranteeExchangeRate[]>();
	for (const row of getExchangePointRates(database, uniqueSeriesIds)) {
		appendMapArrayValue(
			ratesBySeries,
			row.gacha_series_id,
			mapGachaGuaranteeExchangeRate(row),
		);
	}
	return ratesBySeries;
}

function uniqueSafeIntegers(values: readonly number[]): number[] {
	return [...new Set(values)].filter((value) => Number.isSafeInteger(value));
}
