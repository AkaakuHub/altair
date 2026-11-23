import type { GachaGuaranteeExchangeRate } from './gacha-definition.ts';
import type { GachaGuaranteeExchangeItemState } from './gacha-guarantee-types.ts';
import type { UserGachaState } from './gacha-types.ts';
import {
	hasUserCardTemplateSeries,
	type UserCardCollectionState,
} from './user-card-aggregate-state.ts';
import type { UserCardTemplateState } from './user-card-types.ts';

export function resolveGachaGuaranteeExchangeItems(
	userGacha: UserGachaState,
	masterItems: readonly GachaGuaranteeExchangeItemState[],
): GachaGuaranteeExchangeItemState[] {
	const progressByRateId = new Map(
		userGacha.guaranteeExchangeItemList.map((item) => [
			item.exchangePointRateId,
			item,
		]),
	);
	return masterItems.map((masterItem) =>
		cloneGachaGuaranteeExchangeItem(
			progressByRateId.get(masterItem.exchangePointRateId) ?? masterItem,
		),
	);
}

export function applyGachaGuaranteeExchangeItemOwnership(
	exchangeItems: readonly GachaGuaranteeExchangeItemState[],
	exchangeRates: readonly GachaGuaranteeExchangeRate[],
	userCards: UserCardCollectionState,
	resolveCardTemplate: (
		cardDatasId: number,
	) => UserCardTemplateState | undefined,
): GachaGuaranteeExchangeItemState[] {
	const exchangeRateById = new Map(
		exchangeRates.map((rate) => [rate.exchangePointRateId, rate]),
	);
	return exchangeItems.map((item) => {
		const exchangeRate = exchangeRateById.get(item.exchangePointRateId);
		if (exchangeRate?.exchangeItemType !== 2) {
			return cloneGachaGuaranteeExchangeItem(item);
		}
		const template = resolveCardTemplate(exchangeRate.exchangeItemId);
		if (!template) return cloneGachaGuaranteeExchangeItem(item);
		return {
			...cloneGachaGuaranteeExchangeItem(item),
			isHaving: hasUserCardTemplateSeries(userCards, template),
		};
	});
}

export function hasGachaGuaranteeExchangeProgress(
	item: GachaGuaranteeExchangeItemState,
): boolean {
	return item.isHaving || item.remainingExchangeNum !== -1;
}

function cloneGachaGuaranteeExchangeItem(
	item: GachaGuaranteeExchangeItemState,
): GachaGuaranteeExchangeItemState {
	return {
		exchangePointRateId: item.exchangePointRateId,
		isHaving: item.isHaving,
		remainingExchangeNum: item.remainingExchangeNum,
	};
}
