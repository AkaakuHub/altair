import type {
	UserDeckDataState,
	UserDeckState,
} from '../state/user-deck-definition.ts';
import { createUserDeckCardStateFromIds } from '../state/user-deck-definition.ts';

export function projectUserDecks(
	canonical: UserDeckState,
	visibleCardDataIds: ReadonlySet<string>,
): UserDeckState {
	return {
		playerId: canonical.playerId,
		decks: canonical.decks.map((deck) =>
			projectUserDeck(deck, visibleCardDataIds),
		),
	};
}

export function projectUserDeck(
	canonical: UserDeckDataState,
	visibleCardDataIds: ReadonlySet<string>,
): UserDeckDataState {
	return {
		...canonical,
		aceCard: visibleCardDataIds.has(canonical.aceCard) ? canonical.aceCard : '',
		deckCardsList: canonical.deckCardsList.map((card) =>
			projectDeckCard(card, visibleCardDataIds),
		),
	};
}

function projectDeckCard(
	canonical: UserDeckDataState['deckCardsList'][number],
	visibleCardDataIds: ReadonlySet<string>,
): UserDeckDataState['deckCardsList'][number] {
	return createUserDeckCardStateFromIds({
		deckCardId: canonical.d_deck_cards_id,
		slotNo: canonical.slot_no,
		cardDataId: visibleReference(
			canonical,
			'd_card_datas_id',
			visibleCardDataIds,
		),
		sideStyle1CardDataId: visibleReference(
			canonical,
			'side_style1_d_card_datas_id',
			visibleCardDataIds,
		),
		sideStyle2CardDataId: visibleReference(
			canonical,
			'side_style2_d_card_datas_id',
			visibleCardDataIds,
		),
	});
}

function visibleReference(
	card: UserDeckDataState['deckCardsList'][number],
	key:
		| 'd_card_datas_id'
		| 'side_style1_d_card_datas_id'
		| 'side_style2_d_card_datas_id',
	visibleCardDataIds: ReadonlySet<string>,
): string {
	const cardDataId = readCardReference(card, key);
	return visibleCardDataIds.has(cardDataId) ? cardDataId : '';
}

function readCardReference(
	card: UserDeckDataState['deckCardsList'][number],
	key:
		| 'd_card_datas_id'
		| 'side_style1_d_card_datas_id'
		| 'side_style2_d_card_datas_id',
): string {
	if (key === 'd_card_datas_id') {
		return 'd_card_datas_id' in card ? card.d_card_datas_id : '';
	}
	if (key === 'side_style1_d_card_datas_id') {
		return 'side_style1_d_card_datas_id' in card
			? card.side_style1_d_card_datas_id
			: '';
	}
	return 'side_style2_d_card_datas_id' in card
		? card.side_style2_d_card_datas_id
		: '';
}
