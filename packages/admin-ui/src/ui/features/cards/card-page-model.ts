import {
	type CardCatalogViewEntry,
	type UserCard,
	userCardSchema,
} from '@altair/runtime/admin/dto/admin-catalog-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type { AdminFormValues } from '../../../form-value.ts';

export type CardEditorForm = {
	dCardDatasId: string;
	styleLevel: string;
	limitBreakTimes: string;
};

export function getCurrentUserCards(
	data: AdminStateResponse,
	playerId: string,
): UserCard[] {
	if (data.cardCollection?.playerId !== playerId) {
		return [];
	}
	return data.cardCollection.userCardDataList.flatMap((card) => {
		const result = userCardSchema.safeParse(card);
		return result.success ? [result.data] : [];
	});
}

export function createCardEditorForm(card: UserCard): CardEditorForm {
	return {
		dCardDatasId: card.d_card_datas_id,
		styleLevel: String(card.style_level),
		limitBreakTimes: String(card.limit_break_times),
	};
}

export function createCardSelectionForm(
	cards: readonly UserCard[],
	dCardDatasId: string,
): CardEditorForm {
	const card = cards.find((entry) => entry.d_card_datas_id === dCardDatasId);
	return card === undefined
		? { dCardDatasId, styleLevel: '', limitBreakTimes: '' }
		: createCardEditorForm(card);
}

export function addCardFormValues(cardDatasId: string): AdminFormValues {
	return { cardDatasId };
}

export function updateCardFormValues(form: CardEditorForm): AdminFormValues {
	return {
		dCardDatasId: form.dCardDatasId,
		styleLevel: Number(form.styleLevel),
		limitBreakTimes: Number(form.limitBreakTimes),
	};
}

export function removeCardFormValues(dCardDatasId: string): AdminFormValues {
	return { dCardDatasId };
}

export function canAddCard(playerId: string, cardDatasId: string): boolean {
	return playerId.length > 0 && cardDatasId.trim().length > 0;
}

export function canEditCard(
	playerId: string,
	dCardDatasId: string,
	selectedCard: UserCard | undefined,
): boolean {
	return (
		playerId.length > 0 && dCardDatasId.length > 0 && selectedCard !== undefined
	);
}

export function filterCardCatalog(
	catalog: CardCatalogViewEntry[],
	query: string,
): CardCatalogViewEntry[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return catalog;
	}
	return catalog.filter((card) =>
		`${card.cardDatasId} ${card.cardName} ${card.characterId}`
			.toLowerCase()
			.includes(normalized),
	);
}

export function filterUserCards(cards: UserCard[], query: string): UserCard[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return cards;
	}
	return cards.filter((card) =>
		`${card.card_datas_id} ${card.cardName} ${card.style_level} ${card.max_style_level} ${card.limit_break_times} ${card.max_limit_break_times} ${card.d_card_datas_id}`
			.toLowerCase()
			.includes(normalized),
	);
}
