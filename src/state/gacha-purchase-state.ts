import {
	cloneRecord,
	isRecord,
	type JsonObject,
	type JsonValue,
	readJsonObjectArray,
	readNumber,
} from './json-state-utils.ts';

export type GachaPurchasePlanState = {
	masterReleaseId?: string;
	gachaSeriesId: number;
	cardDatasIds: number[];
	bonusResults: JsonObject[];
};

export type GachaResolvedPurchasePlan = {
	masterReleaseId?: string | undefined;
	cardDatasIds: number[];
	bonusResults: JsonObject[];
};

type GachaPurchasePlanOwner = {
	purchasePlans: GachaPurchasePlanState[];
};

export function setGachaPurchasePlan(
	userGacha: GachaPurchasePlanOwner,
	gachaSeriesId: number,
	masterReleaseId: string,
	cardDatasIds: number[],
	bonusResults: JsonObject[],
): boolean {
	if (
		!isPositiveSafeInteger(gachaSeriesId) ||
		cardDatasIds.length === 0 ||
		!cardDatasIds.every(isPositiveSafeInteger) ||
		(bonusResults.length !== 0 &&
			bonusResults.length !== cardDatasIds.length) ||
		!isGachaBonusResultList(bonusResults)
	) {
		return false;
	}
	const nextPlan = {
		masterReleaseId,
		gachaSeriesId,
		cardDatasIds: [...cardDatasIds],
		bonusResults: bonusResults.map(cloneRecord),
	};
	const planIndex = userGacha.purchasePlans.findIndex(
		(plan) => plan.gachaSeriesId === gachaSeriesId,
	);
	if (planIndex === -1) {
		userGacha.purchasePlans = [...userGacha.purchasePlans, nextPlan];
		return true;
	}
	userGacha.purchasePlans = userGacha.purchasePlans.map((plan, index) =>
		index === planIndex ? nextPlan : plan,
	);
	return true;
}

export function deleteGachaPurchasePlan(
	userGacha: GachaPurchasePlanOwner,
	gachaSeriesId: number,
): boolean {
	const currentLength = userGacha.purchasePlans.length;
	userGacha.purchasePlans = userGacha.purchasePlans.filter(
		(plan) => plan.gachaSeriesId !== gachaSeriesId,
	);
	return userGacha.purchasePlans.length !== currentLength;
}

export function consumeGachaPurchasePlan(
	userGacha: GachaPurchasePlanOwner,
	gachaSeriesId: number,
	resultCount: number | undefined,
): GachaPurchasePlanState | undefined {
	if (resultCount === undefined) {
		return undefined;
	}
	const planIndex = userGacha.purchasePlans.findIndex(
		(item) => item.gachaSeriesId === gachaSeriesId,
	);
	const plan =
		planIndex === -1 ? undefined : userGacha.purchasePlans[planIndex];
	if (
		!plan ||
		plan.cardDatasIds.length < resultCount ||
		(plan.bonusResults.length !== 0 && plan.bonusResults.length < resultCount)
	) {
		return undefined;
	}
	const cardDatasIds = plan.cardDatasIds.slice(0, resultCount);
	const bonusResults =
		plan.bonusResults.length === 0
			? []
			: plan.bonusResults.slice(0, resultCount).map(cloneRecord);
	plan.cardDatasIds = plan.cardDatasIds.slice(resultCount);
	plan.bonusResults =
		plan.bonusResults.length === 0 ? [] : plan.bonusResults.slice(resultCount);
	if (plan.cardDatasIds.length === 0 && plan.bonusResults.length === 0) {
		userGacha.purchasePlans = userGacha.purchasePlans.filter(
			(_, index) => index !== planIndex,
		);
	}
	return { gachaSeriesId, cardDatasIds, bonusResults };
}

export function peekGachaPurchasePlan(
	userGacha: GachaPurchasePlanOwner,
	gachaSeriesId: number,
	resultCount: number,
): GachaResolvedPurchasePlan | undefined {
	const plan = userGacha.purchasePlans.find(
		(item) => item.gachaSeriesId === gachaSeriesId,
	);
	if (
		!plan ||
		plan.cardDatasIds.length < resultCount ||
		(plan.bonusResults.length !== 0 && plan.bonusResults.length < resultCount)
	) {
		return undefined;
	}
	return {
		masterReleaseId: plan.masterReleaseId,
		cardDatasIds: plan.cardDatasIds.slice(0, resultCount),
		bonusResults:
			plan.bonusResults.length === 0
				? []
				: plan.bonusResults.slice(0, resultCount).map(cloneRecord),
	};
}

export function createGachaResultList(cardDatasIds: number[]): JsonObject[] {
	return cardDatasIds.map((cardDatasId, index) => ({
		order_id: index + 1,
		card_datas_id: cardDatasId,
	}));
}

export function normalizeGachaBonusResultList(
	bonusResults: JsonObject[],
	resultList: JsonObject[],
): JsonObject[] | undefined {
	if (bonusResults.length === 0) {
		return [];
	}
	if (bonusResults.length !== resultList.length) {
		return undefined;
	}
	const normalized: JsonObject[] = [];
	for (const [index, result] of resultList.entries()) {
		const orderId = readNumber(result.order_id, 'gacha result order_id');
		const bonus = cloneRecord(bonusResults[index] ?? {});
		const bonusOrderId = readNumber(bonus.order_id, 'gacha bonus order_id');
		if (bonusOrderId !== orderId) {
			return undefined;
		}
		readNumber(bonus.grade, 'gacha bonus grade');
		readJsonObjectArray(
			bonus.gacha_bonus_item_result_list,
			'gacha bonus item result list',
		);
		normalized.push(bonus);
	}
	return normalized;
}

export function isGachaPurchasePlanState(
	value: unknown,
): value is GachaPurchasePlanState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		(value.masterReleaseId === undefined ||
			typeof value.masterReleaseId === 'string') &&
		typeof value.gachaSeriesId === 'number' &&
		Array.isArray(value.cardDatasIds) &&
		value.cardDatasIds.every(isPositiveSafeInteger) &&
		Array.isArray(value.bonusResults) &&
		isGachaBonusResultList(value.bonusResults)
	);
}

function isPositiveSafeInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isGachaBonusResultList(
	value: readonly JsonValue[],
): value is JsonObject[] {
	return value.every((item) => {
		if (!isRecord(item)) {
			return false;
		}
		return (
			typeof item.order_id === 'number' &&
			typeof item.grade === 'number' &&
			Array.isArray(item.gacha_bonus_item_result_list) &&
			item.gacha_bonus_item_result_list.every(isRecord)
		);
	});
}
