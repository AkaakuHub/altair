import type {
	GachaExchangeCardState,
	GachaGuaranteeExchangeItemState,
} from './gacha-guarantee-types.ts';
import { isGachaPurchasePlanState } from './gacha-purchase-state.ts';
import type {
	GachaPaidOnlyPurchaseState,
	GachaSeriesProgressState,
	UserGachaState,
} from './gacha-types.ts';
import { isArrayOf, isRecord } from './json-state-utils.ts';

export function isUserGachaState(value: unknown): value is UserGachaState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		isArrayOf(value.seriesProgressList, isGachaSeriesProgressState) &&
		isArrayOf(value.resultHistoryList, isRecord) &&
		isArrayOf(
			value.guaranteeExchangeItemList,
			isGachaGuaranteeExchangeItemState,
		) &&
		isArrayOf(value.exchangeCardList, isGachaExchangeCardState) &&
		isArrayOf(value.purchasePlans, isGachaPurchasePlanState) &&
		(value.paidOnlyPurchaseList === undefined ||
			isArrayOf(value.paidOnlyPurchaseList, isGachaPaidOnlyPurchaseState)) &&
		(value.guaranteeExchangeMasterReleaseId === undefined ||
			typeof value.guaranteeExchangeMasterReleaseId === 'string') &&
		(value.selectTicketExchangeMasterReleaseId === undefined ||
			typeof value.selectTicketExchangeMasterReleaseId === 'string')
	);
}

function isGachaPaidOnlyPurchaseState(
	value: unknown,
): value is GachaPaidOnlyPurchaseState {
	return (
		isRecord(value) &&
		isOptionalGachaSeriesProvenance(value) &&
		typeof value.gachaSeriesId === 'number' &&
		typeof value.gameDate === 'string'
	);
}

function isGachaSeriesProgressState(
	value: unknown,
): value is GachaSeriesProgressState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		isOptionalGachaSeriesProvenance(value) &&
		typeof value.gachaSeriesId === 'number' &&
		typeof value.userExchangePointNum === 'number' &&
		typeof value.userSeriesExecCount === 'number'
	);
}

function isOptionalGachaSeriesProvenance(
	value: Record<string, unknown>,
): boolean {
	return (
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string'))
	);
}

function isGachaGuaranteeExchangeItemState(
	value: unknown,
): value is GachaGuaranteeExchangeItemState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.exchangePointRateId === 'number' &&
		typeof value.isHaving === 'boolean' &&
		typeof value.remainingExchangeNum === 'number'
	);
}

function isGachaExchangeCardState(
	value: unknown,
): value is GachaExchangeCardState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.cardDatasId === 'number' &&
		typeof value.cardName === 'string' &&
		typeof value.cardRarity === 'string'
	);
}
