import type { EntityProvenance } from './entity-provenance.ts';
import type { DuplicateCardRewardResolver } from './gacha-definition.ts';
import {
	createGachaResultList,
	type GachaResolvedPurchasePlan,
	normalizeGachaBonusResultList,
} from './gacha-purchase-state.ts';
import { ensureGachaSeriesProgress } from './gacha-series-progress-state.ts';
import type {
	GachaHistoryEntryFields,
	GachaPurchaseResult,
	GachaSeriesProvenance,
	UserGachaState,
} from './gacha-types.ts';
import {
	type JsonObject,
	readJsonObjectArray,
	readNumber,
} from './json-state-utils.ts';
import {
	getOwnedUserCardSeriesIds,
	readUserCardSeriesId,
	type UserCardCollectionState,
} from './user-card-aggregate-state.ts';
import {
	addUserCardFromTemplate,
	canApplyUserCardProvenance,
} from './user-card-template-state.ts';
import type { UserCardTemplateState } from './user-card-types.ts';

export function executeGachaPurchase(
	userGacha: UserGachaState,
	userCards: UserCardCollectionState,
	resolveCardTemplate: (
		cardDatasId: number,
	) => UserCardTemplateState | undefined,
	resolveCardProvenance: (cardDatasId: number) => EntityProvenance | undefined,
	gachaSeriesId: number,
	gachaSeriesProvenance: GachaSeriesProvenance,
	resultCount: number,
	purchasePlan: GachaResolvedPurchasePlan,
	gachaExchangePointId: number | undefined,
	resolveDuplicateCardReward: DuplicateCardRewardResolver,
	purchase: Readonly<{ price: number; type: number }>,
): GachaPurchaseResult | undefined {
	const progress = ensureGachaSeriesProgress(
		userGacha,
		gachaSeriesId,
		gachaSeriesProvenance,
	);
	if (
		purchasePlan.cardDatasIds.length !== resultCount ||
		(purchasePlan.bonusResults.length !== 0 &&
			purchasePlan.bonusResults.length !== resultCount)
	) {
		return undefined;
	}
	const resultList = updateGachaResultOwnership(
		createGachaResultList(purchasePlan.cardDatasIds),
		userCards,
		resolveCardTemplate,
		resolveCardProvenance,
		resolveDuplicateCardReward,
	);
	if (!resultList) return undefined;
	const bonusResultList = normalizeGachaBonusResultList(
		purchasePlan.bonusResults,
		resultList,
	);
	if (!bonusResultList || gachaExchangePointId === undefined) return undefined;
	const pointBefore = progress.userExchangePointNum;
	const addPoint = resultList.length;
	progress.userExchangePointNum += addPoint;
	progress.userSeriesExecCount += addPoint;
	userGacha.resultHistoryList = [
		createHistoryEntry(resultList, bonusResultList, gachaSeriesId, purchase),
		...userGacha.resultHistoryList,
	];
	return {
		resultList,
		gachaExchangePointId,
		userGuaranteePointNumBefore: pointBefore,
		userGuaranteePointNumAfter: progress.userExchangePointNum,
		bonusResultList,
	};
}

function createHistoryEntry(
	resultList: JsonObject[],
	bonusList: JsonObject[],
	gachaSeriesId: number,
	purchase: Readonly<{ price: number; type: number }>,
): GachaHistoryEntryFields {
	return {
		gacha_date_time: new Date().toISOString(),
		gacha_price_num: purchase.price,
		gacha_price_type: purchase.type,
		gacha_series_id: gachaSeriesId,
		gacha_result_history_info_list: resultList.map((result) => {
			const orderId = readNumber(result.order_id, 'gacha result order_id');
			const bonus = bonusList.find((item) => item.order_id === orderId);
			return {
				card_datas_id: readNumber(
					result.card_datas_id,
					'gacha result card_datas_id',
				),
				gacha_bonus_result_history_list: bonus
					? readJsonObjectArray(
							bonus.gacha_bonus_item_result_list,
							'gacha bonus item result list',
						)
					: [],
				order_id: orderId,
			};
		}),
	};
}

function updateGachaResultOwnership(
	value: unknown,
	userCards: UserCardCollectionState,
	resolveCardTemplate: (
		cardDatasId: number,
	) => UserCardTemplateState | undefined,
	resolveCardProvenance: (cardDatasId: number) => EntityProvenance | undefined,
	resolveDuplicateCardReward: DuplicateCardRewardResolver,
): JsonObject[] | undefined {
	const sourceResults = readJsonObjectArray(
		value,
		'gacha_set_purchase result gacha_result_list',
	).map((result) => {
		const cardDatasId = readNumber(
			result.card_datas_id,
			'gacha result card_datas_id',
		);
		return {
			result,
			template: resolveCardTemplate(cardDatasId),
			provenance: resolveCardProvenance(cardDatasId),
			duplicateReward: resolveDuplicateCardReward(cardDatasId),
		};
	});
	if (
		sourceResults.some(
			(entry) =>
				entry.template === undefined ||
				entry.provenance === undefined ||
				entry.duplicateReward === undefined ||
				!canApplyUserCardProvenance(
					userCards,
					entry.template,
					entry.provenance,
				),
		)
	) {
		return undefined;
	}
	const ownedCardSeriesIds = getOwnedUserCardSeriesIds(userCards);
	const resultList: JsonObject[] = [];
	for (const entry of sourceResults) {
		const { result, template, provenance, duplicateReward } = entry;
		if (!template || !provenance || !duplicateReward) return undefined;
		const cardSeriesId = readUserCardSeriesId(template);
		const isNew = !ownedCardSeriesIds.has(cardSeriesId);
		if (isNew) {
			addUserCardFromTemplate(userCards, template, provenance);
			ownedCardSeriesIds.add(cardSeriesId);
		}
		resultList.push({
			...result,
			is_new: isNew,
			coin_num: isNew ? 0 : duplicateReward.coinNum,
			material_limitbreak_item_id: duplicateReward.materialLimitBreakItemId,
			material_limitbreak_num: isNew
				? 0
				: duplicateReward.materialLimitBreakNum,
		});
	}
	return resultList;
}
