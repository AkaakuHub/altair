import type {
	DuplicateCardRewardResolver,
	GachaGuaranteeExchangeRate,
} from './gacha-definition.ts';
import type {
	GachaGuaranteeExchangeItemState,
	GachaReceiptItemState,
} from './gacha-guarantee-types.ts';
import { createGachaExchangeReceiptItems } from './gacha-select-ticket-receipt.ts';
import {
	ensureGachaSeriesProgress,
	findGachaSeriesProgress,
} from './gacha-series-progress-state.ts';
import type { GachaSeriesProvenance, UserGachaState } from './gacha-types.ts';
import type { UserCardCollectionState } from './user-card-aggregate-state.ts';
import type { UserCardTemplateState } from './user-card-types.ts';

export function exchangeGachaGuaranteePointItem(
	userGacha: UserGachaState,
	userCards: UserCardCollectionState,
	resolveCardTemplate: (
		cardDatasId: number,
	) => UserCardTemplateState | undefined,
	exchangeRate: GachaGuaranteeExchangeRate,
	gachaSeriesProvenance: GachaSeriesProvenance,
	resolveDuplicateCardReward: DuplicateCardRewardResolver,
	applyReceiptItems: (
		receiptItems: readonly GachaReceiptItemState[],
	) => boolean,
): GachaReceiptItemState[] | undefined {
	const progressBefore = findGachaSeriesProgress(
		userGacha,
		exchangeRate.gachaSeriesId,
		gachaSeriesProvenance,
	);
	const existingExchangeItem = userGacha.guaranteeExchangeItemList.find(
		(item) => item.exchangePointRateId === exchangeRate.exchangePointRateId,
	);
	if (
		(progressBefore?.userExchangePointNum ?? 0) < exchangeRate.exchangePrice ||
		existingExchangeItem?.remainingExchangeNum === 0
	) {
		return undefined;
	}
	const receiptItems = createGachaExchangeReceiptItems(
		userCards,
		resolveCardTemplate,
		exchangeRate.exchangeItemType,
		exchangeRate.exchangeItemId,
		exchangeRate.exchangeItemQuantity,
		resolveDuplicateCardReward,
	);
	if (!receiptItems) return undefined;
	if (!applyReceiptItems(receiptItems)) return undefined;
	const progress = ensureGachaSeriesProgress(
		userGacha,
		exchangeRate.gachaSeriesId,
		gachaSeriesProvenance,
	);
	progress.userExchangePointNum -= exchangeRate.exchangePrice;
	const exchangeItem =
		existingExchangeItem ??
		createGachaGuaranteeExchangeItem(exchangeRate.exchangePointRateId);
	if (existingExchangeItem === undefined) {
		userGacha.guaranteeExchangeItemList = [
			...userGacha.guaranteeExchangeItemList,
			exchangeItem,
		];
	}
	exchangeItem.isHaving = true;
	if (exchangeRate.limitedCount > 0) {
		const currentRemaining =
			exchangeItem.remainingExchangeNum < 0
				? exchangeRate.limitedCount
				: exchangeItem.remainingExchangeNum;
		exchangeItem.remainingExchangeNum = Math.max(currentRemaining - 1, 0);
	}
	return receiptItems;
}

export function setGachaGuaranteeExchangeItem(
	userGacha: UserGachaState,
	exchangePointRateId: number,
	isHaving: boolean,
	remainingExchangeNum: number,
): boolean {
	if (
		!Number.isSafeInteger(exchangePointRateId) ||
		exchangePointRateId <= 0 ||
		!Number.isSafeInteger(remainingExchangeNum)
	) {
		return false;
	}
	const existingItem = userGacha.guaranteeExchangeItemList.find(
		(exchangeItem) => exchangeItem.exchangePointRateId === exchangePointRateId,
	);
	if (existingItem) {
		existingItem.isHaving = isHaving;
		existingItem.remainingExchangeNum = remainingExchangeNum;
		return true;
	}
	userGacha.guaranteeExchangeItemList = [
		...userGacha.guaranteeExchangeItemList,
		{ exchangePointRateId, isHaving, remainingExchangeNum },
	];
	return true;
}

function createGachaGuaranteeExchangeItem(
	exchangePointRateId: number,
): GachaGuaranteeExchangeItemState {
	return {
		exchangePointRateId,
		isHaving: false,
		remainingExchangeNum: -1,
	};
}
