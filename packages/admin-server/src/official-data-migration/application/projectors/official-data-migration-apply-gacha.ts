import { hasGachaGuaranteeExchangeProgress } from '../../../../../../src/state/gacha-guarantee-ownership.ts';
import type {
	GachaExchangeCardState,
	GachaGuaranteeExchangeItemState,
} from '../../../../../../src/state/gacha-guarantee-types.ts';
import type {
	GachaHistoryEntryState,
	GachaSeriesProgressState,
	UserGachaState,
} from '../../../../../../src/state/gacha-types.ts';
import { cloneJsonObject } from '../../../../../../src/state/json-state-utils.ts';
import {
	type JsonRecord,
	type OfficialDataMigrationDump,
	readNumber,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';
import { isSuccessfulOfficialDataMigrationResponse } from './official-data-migration-apply-events.ts';

export function createGachaFromResponses(
	playerId: string,
	seriesResponse: JsonRecord | undefined,
	historyResponse: JsonRecord | undefined,
	events: OfficialDataMigrationDump['events'],
): UserGachaState | null {
	const guaranteeExchangeItemList = readGachaGuaranteeExchangeItemList(events);
	const exchangeCardList = readGachaExchangeCardList(events);
	if (
		seriesResponse === undefined &&
		historyResponse === undefined &&
		guaranteeExchangeItemList.length === 0 &&
		exchangeCardList.length === 0
	) {
		return null;
	}
	return {
		playerId,
		seriesProgressList: readRecordArray(seriesResponse?.gacha_series_list)
			.map(createGachaSeriesProgress)
			.filter(
				(progress): progress is GachaSeriesProgressState => progress !== null,
			),
		resultHistoryList: readGachaHistoryEntries(historyResponse),
		guaranteeExchangeItemList,
		exchangeCardList,
		purchasePlans: [],
		paidOnlyPurchaseList: [],
	};
}

function readGachaGuaranteeExchangeItemList(
	events: OfficialDataMigrationDump['events'],
): GachaGuaranteeExchangeItemState[] {
	return events
		.filter(
			isSuccessfulOfficialDataMigrationResponse(
				'/v1/gacha/get_guarantee_point_list',
			),
		)
		.flatMap((event) => readRecordArray(event.response?.exchange_item_list))
		.map(createGachaGuaranteeExchangeItem)
		.filter((item): item is GachaGuaranteeExchangeItemState => item !== null)
		.filter(hasGachaGuaranteeExchangeProgress);
}

function createGachaGuaranteeExchangeItem(
	item: JsonRecord,
): GachaGuaranteeExchangeItemState | null {
	const exchangePointRateId = readNumber(item.exchange_point_rate_id);
	const remainingExchangeNum = readNumber(item.remaining_exchange_num);
	if (exchangePointRateId === null || remainingExchangeNum === null) {
		return null;
	}
	return {
		exchangePointRateId,
		isHaving: item.is_having === true,
		remainingExchangeNum,
	};
}

function readGachaExchangeCardList(
	events: OfficialDataMigrationDump['events'],
): GachaExchangeCardState[] {
	return events
		.filter(
			isSuccessfulOfficialDataMigrationResponse(
				'/v1/gacha/get_exchange_card_having_list',
			),
		)
		.flatMap((event) => readRecordArray(event.response?.exchange_card_list))
		.map(createGachaExchangeCard)
		.filter((card): card is GachaExchangeCardState => card !== null);
}

function createGachaExchangeCard(
	card: JsonRecord,
): GachaExchangeCardState | null {
	const cardDatasId = readNumber(card.card_datas_id);
	const cardName = readString(card.card_name);
	const cardRarity = readString(card.card_rarity);
	if (cardDatasId === null || cardName === null || cardRarity === null) {
		return null;
	}
	return { cardDatasId, cardName, cardRarity };
}

function createGachaSeriesProgress(
	series: JsonRecord,
): GachaSeriesProgressState | null {
	const gachaSeriesId = readNumber(series.gacha_series_id);
	const userExchangePointNum = readNumber(series.user_exchange_point_num);
	const userSeriesExecCount = readNumber(series.user_series_exec_count);
	if (
		gachaSeriesId === null ||
		userExchangePointNum === null ||
		userSeriesExecCount === null
	) {
		return null;
	}
	return { gachaSeriesId, userExchangePointNum, userSeriesExecCount };
}

function readGachaHistoryEntries(
	response: JsonRecord | undefined,
): GachaHistoryEntryState[] {
	if (response === undefined) {
		return [];
	}
	const sourceEntries = Array.isArray(response.gacha_history_list)
		? response.gacha_history_list
		: response.history_list;
	return readRecordArray(sourceEntries).map((entry) =>
		cloneJsonObject(entry, 'official gacha history'),
	);
}
