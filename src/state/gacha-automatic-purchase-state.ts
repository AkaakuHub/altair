import { randomInt } from 'node:crypto';
import type {
	GachaDrawBonusItem,
	GachaDrawCard,
	GachaDrawRate,
} from './gacha-definition.ts';
import type { GachaResolvedPurchasePlan } from './gacha-purchase-state.ts';
import type { JsonObject } from './json-state-utils.ts';

export function createGachaAutomaticPurchasePlan(
	drawRates: readonly GachaDrawRate[],
	resultCount: number,
): GachaResolvedPurchasePlan | undefined {
	const cardDatasIds: number[] = [];
	const bonusResults: JsonObject[] = [];
	for (let orderId = 1; orderId <= resultCount; orderId += 1) {
		const drawRate = findDrawRate(drawRates, orderId);
		if (!drawRate) {
			return undefined;
		}
		const card = pickWeighted(drawRate.cardList);
		if (!card) {
			return undefined;
		}
		cardDatasIds.push(card.cardDatasId);
		if (drawRate.isGiftless) {
			continue;
		}
		const bonusItem = pickWeighted(drawRate.bonusItemList);
		if (!bonusItem) {
			return undefined;
		}
		bonusResults.push({
			order_id: orderId,
			grade: bonusItem.rank,
			gacha_bonus_item_result_list: [
				{
					item_type: 1,
					item_id: bonusItem.itemId,
					item_num: bonusItem.quantity,
				},
			],
		});
	}
	return { cardDatasIds, bonusResults };
}

function findDrawRate(
	drawRates: readonly GachaDrawRate[],
	orderId: number,
): GachaDrawRate | undefined {
	return drawRates.find(
		(rate) => rate.minDrawCount <= orderId && orderId <= rate.maxDrawCount,
	);
}

function pickWeighted<T extends GachaDrawCard | GachaDrawBonusItem>(
	items: readonly T[],
): T | undefined {
	const totalOdds = items.reduce((sum, item) => sum + item.odds, 0);
	if (totalOdds <= 0) {
		return undefined;
	}
	const selected = randomInt(totalOdds);
	let current = 0;
	for (const item of items) {
		current += item.odds;
		if (selected < current) {
			return item;
		}
	}
	return undefined;
}
