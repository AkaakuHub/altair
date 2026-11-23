import type { GachaSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminGachaSeriesActivation } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { AdminPageProps } from '../../page-props.ts';
import type {
	findActiveGacha,
	GachaGuaranteeExchangeItem,
	GuaranteeForm,
} from './gacha-page-model.ts';

export type PurchasePlanCardOption = {
	cardDatasId: number;
	cardName: string;
	characterId: number;
};
export type GuaranteeExchangeRow =
	GachaSeriesSummary['guaranteeExchangeRateList'][number] &
		Pick<GachaGuaranteeExchangeItem, 'isHaving' | 'remainingExchangeNum'>;

export function activeGachaSeriesList(
	seriesList: GachaSeriesSummary[],
	activations: AdminGachaSeriesActivation[],
): GachaSeriesSummary[] {
	const enabledGachaSeriesIds = new Set(
		activations
			.filter((activation) => activation.isEnabled)
			.map((activation) => activation.gachaSeriesId),
	);
	return seriesList.filter((series) =>
		enabledGachaSeriesIds.has(series.gachaSeriesId),
	);
}

export function createPurchasePlanCardOptions(
	series: GachaSeriesSummary | undefined,
	cardCatalog: AdminPageProps['data']['cardCatalog'],
): PurchasePlanCardOption[] {
	if (series === undefined) {
		return [];
	}
	const cardById = new Map(cardCatalog.map((card) => [card.cardDatasId, card]));
	return series.cardList.map((cardDatasId) => {
		const card = cardById.get(cardDatasId);
		return {
			cardDatasId,
			cardName: card?.cardName ?? '',
			characterId: card?.characterId ?? 0,
		};
	});
}

export function createGuaranteeExchangeRows(
	series: GachaSeriesSummary | undefined,
	userGacha: ReturnType<typeof findActiveGacha>,
): GuaranteeExchangeRow[] {
	if (series === undefined) {
		return [];
	}
	const itemStateByRateId = new Map(
		userGacha?.guaranteeExchangeItemList.map((item) => [
			item.exchangePointRateId,
			item,
		]) ?? [],
	);
	return series.guaranteeExchangeRateList.map((rate) => {
		const itemState = itemStateByRateId.get(rate.exchangePointRateId);
		return {
			...rate,
			isHaving: itemState?.isHaving ?? false,
			remainingExchangeNum: itemState?.remainingExchangeNum ?? -1,
		};
	});
}

export function createGuaranteeFormFromRow(
	row: GuaranteeExchangeRow,
): GuaranteeForm {
	return {
		gachaSeriesId: row.gachaSeriesId,
		exchangePointRateId: row.exchangePointRateId,
		isHaving: row.isHaving,
		remainingExchangeNum: String(row.remainingExchangeNum),
	};
}

export function filterGachaSeriesByQuery(
	seriesList: GachaSeriesSummary[],
	query: string,
): GachaSeriesSummary[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (normalizedQuery.length === 0) {
		return seriesList;
	}
	return seriesList.filter((series) =>
		`${series.gachaSeriesId} ${series.title} ${series.gachaType} ${series.isPartyGacha ? 'party' : ''} ${series.startTime} ${series.endTime} ${series.timeLimitGachaEndTime ?? ''}`
			.toLowerCase()
			.includes(normalizedQuery),
	);
}
