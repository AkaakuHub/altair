import type { GachaSeriesSummaryMaster } from '../../master-data/gacha-series-master.ts';
import type {
	GachaExchangeCardState,
	GachaGuaranteeExchangeItemState,
	GachaReceiptItemState,
} from '../../state/gacha-guarantee-types.ts';
import {
	canPurchasePaidOnlyGacha,
	findGachaSeriesProgress,
} from '../../state/gacha-series-progress-state.ts';
import type {
	GachaPurchaseResult,
	GachaSeriesProvenance,
	UserGachaState,
} from '../../state/gacha-types.ts';
import { cloneJsonObject } from '../../state/json-state-utils.ts';
import {
	cardDatasIdToSeriesId,
	getUserCardListSeriesIds,
} from '../../state/user-card-aggregate-state.ts';
import type { UserCardDataState } from '../../state/user-card-types.ts';
import type {
	GachaExchangeCardHavingListResponse,
	GachaGuaranteePointExchangeResponse,
	GachaGuaranteePointListResponse,
	GachaHistoryResponse,
	GachaPurchaseResponse,
	GachaSeriesListResponse,
	GachaSeriesResponse,
	SelectTicketExchangeListResponse,
	SelectTicketExchangeReceiptResponse,
	SelectTicketSeriesResponse,
} from '../response-types/gacha-response-types.ts';

export function createGachaSeriesListResponse(
	userGacha: UserGachaState,
	seriesSummaries: readonly GachaSeriesSummaryMaster[],
	gameDate: string,
	selectTicketSeriesList: readonly SelectTicketSeriesResponse[],
	resolveSeriesProvenance: (
		gachaSeriesId: number,
	) => GachaSeriesProvenance | undefined,
): GachaSeriesListResponse {
	return {
		convert_exchange_point_list: [],
		expired_limited_gacha_ticket_id_confirm_list: [],
		gacha_series_list: createGachaSeriesResponseList(
			userGacha,
			seriesSummaries,
			gameDate,
			resolveSeriesProvenance,
		),
		select_ticket_series_list: [...selectTicketSeriesList],
	};
}

export function createGachaHistoryResponse(
	userGacha: UserGachaState,
): GachaHistoryResponse {
	return {
		gacha_result_history_list: userGacha.resultHistoryList.map((history) =>
			cloneJsonObject(history, 'gacha history response'),
		),
	};
}

export function createGachaPurchaseResponse(
	userGacha: UserGachaState,
	purchaseResult: GachaPurchaseResult,
	seriesSummaries: readonly GachaSeriesSummaryMaster[],
	gameDate: string,
	resolveSeriesProvenance: (
		gachaSeriesId: number,
	) => GachaSeriesProvenance | undefined,
): GachaPurchaseResponse {
	const seriesList = createGachaSeriesResponseList(
		userGacha,
		seriesSummaries,
		gameDate,
		resolveSeriesProvenance,
	);
	return {
		gacha_result_list: purchaseResult.resultList.map((result) =>
			cloneJsonObject(result, 'gacha purchase result response'),
		),
		gacha_guarantee_point: {
			exchange_point_id: purchaseResult.gachaExchangePointId,
			user_guarantee_point_num_before:
				purchaseResult.userGuaranteePointNumBefore,
			user_guarantee_point_num_after: purchaseResult.userGuaranteePointNumAfter,
		},
		gacha_bonus_result_list: purchaseResult.bonusResultList.map((result) =>
			cloneJsonObject(result, 'gacha purchase bonus result response'),
		),
		user_single_ticket_num: 0,
		user_consective_ticket_num: 0,
		gacha_campaign_info_list: [],
		gacha_series_list: seriesList,
	};
}

export function createGachaGuaranteePointListResponse(
	exchangeItemList: readonly GachaGuaranteeExchangeItemState[],
): GachaGuaranteePointListResponse {
	return {
		exchange_item_list: exchangeItemList.map((item) => ({
			exchange_point_rate_id: item.exchangePointRateId,
			is_having: item.isHaving,
			remaining_exchange_num: item.remainingExchangeNum,
		})),
	};
}

export function createGachaGuaranteePointExchangeResponse(
	receiptItems: readonly GachaReceiptItemState[],
): GachaGuaranteePointExchangeResponse {
	return {
		receipt_items: receiptItems.map((item) => ({
			get_id: item.get_id,
			get_item_type: item.get_item_type,
			get_num: item.get_num,
			is_new: item.is_new,
		})),
	};
}

export function createSelectTicketExchangeListResponse(
	selectTicketItems: readonly {
		selectTicketSeriesId: number;
		userSelectTicketNum: number;
	}[],
): SelectTicketExchangeListResponse {
	return {
		select_ticket_exchange_list: selectTicketItems
			.filter((item) => item.userSelectTicketNum > 0)
			.map((item) => ({
				select_ticket_series_id: item.selectTicketSeriesId,
				user_select_ticket_num: item.userSelectTicketNum,
			})),
	};
}

export function createGachaExchangeCardHavingListResponse(
	exchangeCardList: readonly GachaExchangeCardState[],
	userCardDataList: UserCardDataState[],
): GachaExchangeCardHavingListResponse {
	const havingCardSeriesIds = getUserCardListSeriesIds(userCardDataList);
	return {
		exchange_card_list: exchangeCardList.map((card) => ({
			card_datas_id: card.cardDatasId,
			card_name: card.cardName,
			card_rarity: card.cardRarity,
			is_having: havingCardSeriesIds.has(
				cardDatasIdToSeriesId(card.cardDatasId),
			),
		})),
	};
}

function createGachaSeriesResponseList(
	userGacha: UserGachaState,
	seriesSummaries: readonly GachaSeriesSummaryMaster[],
	gameDate: string,
	resolveSeriesProvenance: (
		gachaSeriesId: number,
	) => GachaSeriesProvenance | undefined,
): GachaSeriesResponse[] {
	return seriesSummaries
		.map((summary) => {
			const provenance = resolveSeriesProvenance(summary.gachaSeriesId);
			return provenance === undefined
				? undefined
				: createGachaSeriesResponse(userGacha, summary, gameDate, provenance);
		})
		.filter((series) => series !== undefined);
}

function createGachaSeriesResponse(
	userGacha: UserGachaState,
	summary: GachaSeriesSummaryMaster,
	gameDate: string,
	provenance: GachaSeriesProvenance,
): GachaSeriesResponse {
	const isPaidPurchaseAvailable =
		summary.isPaidEnable &&
		canPurchasePaidOnlyGacha(
			userGacha,
			summary.gachaSeriesId,
			gameDate,
			provenance,
		);
	const progress = findGachaSeriesProgress(
		userGacha,
		summary.gachaSeriesId,
		provenance,
	);
	return {
		gacha_series_id: summary.gachaSeriesId,
		card_list: summary.cardList,
		is_single_enable: summary.isSingleEnable,
		is_consective_enable: summary.isConsectiveEnable,
		is_paid_enable: isPaidPurchaseAvailable,
		user_single_ticket_num: 0,
		user_consective_ticket_num: 0,
		single_campaign_id: 0,
		consective_campaign_id: 0,
		remaining_single_campaign_count: 0,
		remaining_consective_campaign_count: 0,
		remaining_limited_gacha_count: 0,
		remaining_limited_consective_gacha_count: 0,
		remaining_limited_paid_gacha_count: isPaidPurchaseAvailable ? 1 : 0,
		remaining_rotation_count: 0,
		received_gacha_prize_list: [],
		user_exchange_point_num: progress?.userExchangePointNum ?? 0,
		user_series_exec_count: progress?.userSeriesExecCount ?? 0,
		time_limit_gacha_end_time: summary.timeLimitGachaEndTime,
	};
}

export function createSelectTicketExchangeReceipt(
	receiptItems: readonly GachaReceiptItemState[],
): SelectTicketExchangeReceiptResponse {
	return {
		receipt_items: receiptItems.map((item) => ({
			get_id: item.get_id,
			get_item_type: item.get_item_type,
			get_num: item.get_num,
			is_new: item.is_new,
		})),
	};
}
