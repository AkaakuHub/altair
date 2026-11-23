import type { GachaSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type {
	AdminGachaPurchasePlan,
	AdminUserGacha,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { AdminFormValues } from '../../../form-value.ts';
import { findPlayerState } from '../player-state.ts';

export type GachaGuaranteeExchangeItem =
	AdminUserGacha['guaranteeExchangeItemList'][number];

export type SeriesProgressForm = {
	gachaSeriesId: number;
	userExchangePointNum: string;
	userSeriesExecCount: string;
};

export type GuaranteeForm = {
	gachaSeriesId: number;
	exchangePointRateId: number;
	isHaving: boolean;
	remainingExchangeNum: string;
};

export type PurchasePlanForm = {
	gachaSeriesId: number;
	cardDatasIds: number[];
};

export function findActiveGacha(
	data: AdminStateResponse,
	playerId: string,
): AdminUserGacha | undefined {
	return findPlayerState(data.state.userGachas, playerId);
}

export function getSeriesProgressForm(
	userGacha: AdminUserGacha | undefined,
	gachaSeriesId: number,
): SeriesProgressForm {
	const progress = userGacha?.seriesProgressList.find(
		(item) => item.gachaSeriesId === gachaSeriesId,
	);
	return {
		gachaSeriesId,
		userExchangePointNum: String(progress?.userExchangePointNum ?? 0),
		userSeriesExecCount: String(progress?.userSeriesExecCount ?? 0),
	};
}

export function createGuaranteeForm(
	userGacha: AdminUserGacha | undefined,
	series: GachaSeriesSummary | undefined,
): GuaranteeForm {
	const guaranteeItem = findGuaranteeItem(userGacha, series);
	const firstRate = series?.guaranteeExchangeRateList[0];
	return {
		gachaSeriesId: series?.gachaSeriesId ?? 0,
		exchangePointRateId:
			guaranteeItem?.exchangePointRateId ?? firstRate?.exchangePointRateId ?? 0,
		isHaving: guaranteeItem?.isHaving ?? false,
		remainingExchangeNum: String(guaranteeItem?.remainingExchangeNum ?? -1),
	};
}

export function getGuaranteeFormForRate(
	userGacha: AdminUserGacha | undefined,
	series: GachaSeriesSummary | undefined,
	exchangePointRateId: number,
): GuaranteeForm | null {
	if (
		!series?.guaranteeExchangeRateList.some(
			(rate) => rate.exchangePointRateId === exchangePointRateId,
		)
	)
		return null;
	const item = userGacha?.guaranteeExchangeItemList.find(
		(entry) => entry.exchangePointRateId === exchangePointRateId,
	);
	return {
		gachaSeriesId: series.gachaSeriesId,
		exchangePointRateId,
		isHaving: item?.isHaving ?? false,
		remainingExchangeNum: String(item?.remainingExchangeNum ?? -1),
	};
}

function findGuaranteeItem(
	userGacha: AdminUserGacha | undefined,
	series: GachaSeriesSummary | undefined,
): GachaGuaranteeExchangeItem | undefined {
	const exchangePointRateIds = new Set(
		series?.guaranteeExchangeRateList.map((rate) => rate.exchangePointRateId) ??
			[],
	);
	return userGacha?.guaranteeExchangeItemList.find((item) =>
		exchangePointRateIds.has(item.exchangePointRateId),
	);
}

export function createPurchasePlanForm(
	userGacha: AdminUserGacha | undefined,
	gachaSeriesId: number,
): PurchasePlanForm {
	return {
		gachaSeriesId,
		cardDatasIds:
			findPurchasePlan(userGacha, gachaSeriesId)?.cardDatasIds ?? [],
	};
}

export function findPurchasePlan(
	userGacha: AdminUserGacha | undefined,
	gachaSeriesId: number,
): AdminGachaPurchasePlan | undefined {
	return userGacha?.purchasePlans.find(
		(plan) => plan.gachaSeriesId === gachaSeriesId,
	);
}

export function createPurchasePlanValues(
	form: PurchasePlanForm,
): AdminFormValues {
	const cardDatasIds = form.cardDatasIds.filter(
		(cardDatasId) => Number.isSafeInteger(cardDatasId) && cardDatasId > 0,
	);
	return {
		gachaSeriesId: form.gachaSeriesId,
		resultCount: cardDatasIds.length,
		...Object.fromEntries(
			cardDatasIds.map((cardDatasId, index) => [
				`cardDatasId${index + 1}`,
				cardDatasId,
			]),
		),
	};
}
