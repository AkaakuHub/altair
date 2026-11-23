import type { PurchasePlanForm } from './gacha-page-model.ts';
import type { PurchasePlanCardOption } from './gacha-series-view.ts';
export type PurchasePlanSelectedCard = PurchasePlanCardOption & {
	order: number;
};
export function filterPurchasePlanCardOptions(
	cards: PurchasePlanCardOption[],
	query: string,
) {
	const q = query.trim().toLowerCase();
	return q.length === 0
		? cards
		: cards.filter((card) =>
				`${card.cardDatasId} ${card.cardName} ${card.characterId}`
					.toLowerCase()
					.includes(q),
			);
}
export function createPurchasePlanSelectedCards(
	ids: number[],
	options: PurchasePlanCardOption[],
): PurchasePlanSelectedCard[] {
	const map = new Map(options.map((item) => [item.cardDatasId, item]));
	return ids.map((id, index) => ({
		order: index + 1,
		cardDatasId: id,
		cardName: map.get(id)?.cardName ?? '',
		characterId: map.get(id)?.characterId ?? 0,
	}));
}
export function addPurchasePlanCard(
	form: PurchasePlanForm,
	id: number,
): PurchasePlanForm {
	return { ...form, cardDatasIds: [...form.cardDatasIds, id].slice(0, 10) };
}
export function removePurchasePlanCard(
	form: PurchasePlanForm,
	index: number,
): PurchasePlanForm {
	const ids = [...form.cardDatasIds];
	ids.splice(index, 1);
	return { ...form, cardDatasIds: ids };
}
