import type { Database } from 'bun:sqlite';
import { getCardCharacterBonusFromDatabase } from '../../master-data/card-detail-template.ts';
import { defaultCharacterBonus } from '../../master-data/character-bonus.ts';
import type {
	DeckResponse,
	UserCardDataResponse,
} from '../response-types/user-card-deck-response-types.ts';
import {
	getStringField,
	isJsonRecord,
} from '../route-support/request-fields.ts';
import { numberValue } from './json-utils.ts';
import type { JsonRecord } from './types.ts';

export function getCharacterBonusFromDatabase(
	database: Database,
	deckData: DeckResponse | JsonRecord,
	userCardDataList: UserCardDataResponse[],
): JsonRecord {
	if (!isJsonRecord(deckData) || !Array.isArray(deckData.deck_cards_list)) {
		return normalizeLiveCharacterBonus(defaultCharacterBonus());
	}
	const firstCard = deckData.deck_cards_list[0];
	if (!isJsonRecord(firstCard)) {
		return normalizeLiveCharacterBonus(defaultCharacterBonus());
	}
	const userCard = findDeckUserCard(firstCard, userCardDataList);
	if (isJsonRecord(userCard?.character_bonus)) {
		return normalizeLiveCharacterBonus(userCard.character_bonus);
	}
	const cardDatasId = findDeckCardDatasId(firstCard, userCardDataList);
	if (cardDatasId === 0) {
		return normalizeLiveCharacterBonus(defaultCharacterBonus());
	}
	return normalizeLiveCharacterBonus(
		getCardCharacterBonusFromDatabase(database, cardDatasId),
	);
}

export function normalizeLiveCharacterBonus(
	characterBonus: JsonRecord,
): JsonRecord {
	return {
		...structuredClone(characterBonus),
		music_mastery_bonus_list: Array.isArray(
			characterBonus.music_mastery_bonus_list,
		)
			? structuredClone(characterBonus.music_mastery_bonus_list)
			: [],
	};
}

function findDeckCardDatasId(
	deckCard: JsonRecord,
	userCardDataList: UserCardDataResponse[],
): number {
	const cardDatasId = numberValue(deckCard.card_datas_id);
	if (cardDatasId > 0) return cardDatasId;
	const dCardDatasId = getStringField(deckCard, 'd_card_datas_id');
	if (dCardDatasId.length === 0) return 0;
	return (
		userCardDataList.find((card) => card.d_card_datas_id === dCardDatasId)
			?.card_datas_id ?? 0
	);
}

function findDeckUserCard(
	deckCard: JsonRecord,
	userCardDataList: UserCardDataResponse[],
): UserCardDataResponse | undefined {
	const dCardDatasId = getStringField(deckCard, 'd_card_datas_id');
	return dCardDatasId.length === 0
		? undefined
		: userCardDataList.find(
				(userCard) => userCard.d_card_datas_id === dCardDatasId,
			);
}
