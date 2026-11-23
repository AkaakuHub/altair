import { cloneJsonObject } from '../../../../../../src/state/json-state-utils.ts';
import type { UserCardCollectionState } from '../../../../../../src/state/user-card-aggregate-state.ts';
import type { UserCardDataState } from '../../../../../../src/state/user-card-types.ts';
import type {
	UserDeckCardState,
	UserDeckDataState,
	UserDeckState,
} from '../../../../../../src/state/user-deck-definition.ts';
import {
	type JsonRecord,
	readNumber,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function createCardsFromResponse(
	playerId: string,
	response: JsonRecord | undefined,
): UserCardCollectionState | null {
	if (response === undefined) {
		return null;
	}
	const userCardDataList = readRecordArray(response.user_card_data_list)
		.map(createUserCardData)
		.filter((card): card is UserCardDataState => card !== null);
	if (
		userCardDataList.length === 0 &&
		!Array.isArray(response.user_card_data_list)
	) {
		return null;
	}
	return { playerId, userCardDataList };
}

function createUserCardData(card: JsonRecord): UserCardDataState | null {
	const dCardDatasId = readString(card.d_card_datas_id);
	const cardDatasId = readNumber(card.card_datas_id);
	if (dCardDatasId === null || cardDatasId === null) {
		return null;
	}
	return {
		...cloneJsonObject(card, 'official user card'),
		d_card_datas_id: dCardDatasId,
		card_datas_id: cardDatasId,
	};
}

export function createDecksFromResponse(
	playerId: string,
	response: JsonRecord | undefined,
): UserDeckState | null {
	if (response === undefined) {
		return null;
	}
	const decks = readRecordArray(response.deck_list)
		.map(createDeckData)
		.filter((deck): deck is UserDeckDataState => deck !== null);
	if (decks.length === 0 && !Array.isArray(response.deck_list)) {
		return null;
	}
	return { playerId, decks };
}

function createDeckData(deck: JsonRecord): UserDeckDataState | null {
	const deckDataId = readString(deck.d_deck_datas_id);
	const deckNo = readNumber(deck.deck_no);
	const generationsId = readNumber(deck.generations_id);
	if (deckDataId === null || deckNo === null || generationsId === null) {
		return null;
	}
	return {
		deckDataId,
		deckName: readString(deck.deck_name) ?? '',
		deckNo,
		generationsId,
		aceCard: readString(deck.ace_card) ?? '',
		deckCardsList: readRecordArray(deck.deck_cards_list)
			.map(createDeckCard)
			.filter((card): card is UserDeckCardState => card !== null),
	};
}

function createDeckCard(card: JsonRecord): UserDeckCardState | null {
	const deckCardId = readString(card.d_deck_cards_id);
	const slotNo = readNumber(card.slot_no);
	if (deckCardId === null || slotNo === null) {
		return null;
	}
	const cardDataId = readString(card.d_card_datas_id);
	const sideStyle1CardDataId = readString(card.side_style1_d_card_datas_id);
	const sideStyle2CardDataId = readString(card.side_style2_d_card_datas_id);
	const base = {
		d_deck_cards_id: deckCardId,
		slot_no: slotNo,
	};
	if (
		cardDataId !== null &&
		sideStyle1CardDataId !== null &&
		sideStyle2CardDataId !== null
	) {
		return {
			...base,
			d_card_datas_id: cardDataId,
			side_style1_d_card_datas_id: sideStyle1CardDataId,
			side_style2_d_card_datas_id: sideStyle2CardDataId,
		};
	}
	if (cardDataId !== null && sideStyle1CardDataId !== null) {
		return {
			...base,
			d_card_datas_id: cardDataId,
			side_style1_d_card_datas_id: sideStyle1CardDataId,
		};
	}
	if (cardDataId !== null && sideStyle2CardDataId !== null) {
		return {
			...base,
			d_card_datas_id: cardDataId,
			side_style2_d_card_datas_id: sideStyle2CardDataId,
		};
	}
	if (sideStyle1CardDataId !== null && sideStyle2CardDataId !== null) {
		return {
			...base,
			side_style1_d_card_datas_id: sideStyle1CardDataId,
			side_style2_d_card_datas_id: sideStyle2CardDataId,
		};
	}
	if (cardDataId !== null) {
		return { ...base, d_card_datas_id: cardDataId };
	}
	if (sideStyle1CardDataId !== null) {
		return { ...base, side_style1_d_card_datas_id: sideStyle1CardDataId };
	}
	if (sideStyle2CardDataId !== null) {
		return { ...base, side_style2_d_card_datas_id: sideStyle2CardDataId };
	}
	return base;
}
