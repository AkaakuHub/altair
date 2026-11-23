import type { GachaSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminUserGacha } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { useCallback } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import {
	createGuaranteeForm,
	createPurchasePlanForm,
	type GuaranteeForm,
	getGuaranteeFormForRate,
	getSeriesProgressForm,
	type PurchasePlanForm,
	type SeriesProgressForm,
} from './gacha-page-model.ts';

function seriesKey(value: { gachaSeriesId: number }): string {
	return String(value.gachaSeriesId);
}
function guaranteeKey(value: GuaranteeForm): string {
	return `${value.gachaSeriesId}:${value.exchangePointRateId}`;
}

export function useGachaDrafts(
	activeGacha: AdminUserGacha | undefined,
	activeSeriesList: GachaSeriesSummary[],
) {
	const initialSeries = activeSeriesList[0];
	const initialSeriesId = initialSeries?.gachaSeriesId ?? 0;
	const resolveSeries = useCallback(
		(value: SeriesProgressForm) => {
			const seriesId =
				value.gachaSeriesId === 0 ? initialSeriesId : value.gachaSeriesId;
			return activeSeriesList.some(
				(series) => series.gachaSeriesId === seriesId,
			)
				? getSeriesProgressForm(activeGacha, seriesId)
				: null;
		},
		[activeGacha, activeSeriesList, initialSeriesId],
	);
	const resolveGuarantee = useCallback(
		(value: GuaranteeForm) => {
			const series = activeSeriesList.find(
				(entry) =>
					entry.gachaSeriesId ===
					(value.gachaSeriesId === 0 ? initialSeriesId : value.gachaSeriesId),
			);
			if (series !== undefined && value.exchangePointRateId === 0)
				return createGuaranteeForm(activeGacha, series);
			return getGuaranteeFormForRate(
				activeGacha,
				series,
				value.exchangePointRateId,
			);
		},
		[activeGacha, activeSeriesList, initialSeriesId],
	);
	const resolvePurchasePlan = useCallback(
		(value: PurchasePlanForm) => {
			const seriesId =
				value.gachaSeriesId === 0 ? initialSeriesId : value.gachaSeriesId;
			return activeSeriesList.some(
				(series) => series.gachaSeriesId === seriesId,
			)
				? createPurchasePlanForm(activeGacha, seriesId)
				: null;
		},
		[activeGacha, activeSeriesList, initialSeriesId],
	);
	return {
		series: useAdminFormDraft(
			getSeriesProgressForm(activeGacha, initialSeriesId),
			resolveSeries,
			seriesKey,
		),
		guarantee: useAdminFormDraft(
			createGuaranteeForm(activeGacha, initialSeries),
			resolveGuarantee,
			guaranteeKey,
		),
		purchasePlan: useAdminFormDraft(
			createPurchasePlanForm(activeGacha, initialSeriesId),
			resolvePurchasePlan,
			seriesKey,
		),
	};
}
