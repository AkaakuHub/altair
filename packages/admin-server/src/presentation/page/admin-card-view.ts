import type {
	AdminCardCollection,
	CardCatalogViewEntry,
	UserCard,
} from '@altair/runtime/admin/dto/admin-catalog-schema.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import {
	type JsonObject,
	readNumber,
} from '../../../../../src/state/json-state-utils.ts';
import type { AdminCardCatalogEntry } from '../../catalog/domain/admin-card-catalog.ts';

export function createAdminCardCatalogView(
	cardCatalog: readonly AdminCardCatalogEntry[],
): CardCatalogViewEntry[] {
	return cardCatalog.map((card) => ({
		cardDatasId: card.cardDatasId,
		dCardDatasId: card.dCardDatasId,
		cardName: card.cardName,
		characterId: card.characterId,
		styleLevel: card.styleLevel,
		maxStyleLevel: card.maxStyleLevel,
		limitBreakTimes: card.limitBreakTimes,
		maxLimitBreakTimes: card.maxLimitBreakTimes,
	}));
}

export function createAdminCardCollectionView(
	state: ServerState,
	cardCatalog: readonly CardCatalogViewEntry[],
): AdminCardCollection | null {
	const selectedAdminPlayerId = state.selectedAdminPlayerId;
	if (selectedAdminPlayerId === null) {
		return null;
	}
	const collection = state.userCards.find(
		(entry) => entry.playerId === selectedAdminPlayerId,
	);
	if (collection === undefined) {
		return null;
	}
	const cardNameById = new Map(
		cardCatalog.map((card) => [card.cardDatasId, card.cardName]),
	);
	return {
		playerId: collection.playerId,
		userCardDataList: collection.userCardDataList.map((card) =>
			createAdminUserCardView(card, cardNameById),
		),
	};
}

function createAdminUserCardView(
	card: JsonObject,
	cardNameById: ReadonlyMap<number, string>,
): UserCard {
	const cardDatasId = readNumber(card.card_datas_id, 'user card card_datas_id');
	return {
		cardName: cardNameById.get(cardDatasId) ?? '',
		d_card_datas_id: readString(
			card.d_card_datas_id,
			'user card d_card_datas_id',
		),
		card_datas_id: cardDatasId,
		style_level: readNumber(card.style_level, 'user card style_level'),
		max_style_level: readNumber(
			card.max_style_level,
			'user card max_style_level',
		),
		limit_break_times: readNumber(
			card.limit_break_times,
			'user card limit_break_times',
		),
		max_limit_break_times: readNumber(
			card.max_limit_break_times,
			'user card max_limit_break_times',
		),
	};
}

function readString(value: unknown, label: string): string {
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(`${label} must be a non-empty string`);
	}
	return value;
}
