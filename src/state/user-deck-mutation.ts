import {
	isJsonObject,
	isRecord,
	type JsonObject,
	numberValue,
	stringField,
} from './json-state-utils.ts';
import {
	createUserDeckCardStateFromIds,
	type UserDeckCardState,
	type UserDeckDataState,
	type UserDeckState,
} from './user-deck-definition.ts';

export function modifyUserDeckList(
	userDeck: UserDeckState,
	body: unknown,
	visibleCardDataIds: ReadonlySet<string>,
): UserDeckDataState[] | undefined {
	if (!isRecord(body) || !Array.isArray(body.modify_deck_list))
		return undefined;
	const modifiedDecks: UserDeckDataState[] = [];
	for (const rawDeck of body.modify_deck_list) {
		if (!isJsonObject(rawDeck)) continue;
		const deckNo = numberValue(rawDeck.deck_no);
		const generationsId = numberValue(rawDeck.generations_id);
		const existingDeck = findExistingDeck(
			userDeck,
			rawDeck,
			deckNo,
			generationsId,
		);
		const deckDataId =
			stringField(rawDeck, 'd_deck_datas_id') ||
			existingDeck?.deckDataId ||
			crypto.randomUUID();
		const deckCardsList = readDeckCards(
			rawDeck.deck_cards_list,
			existingDeck?.deckCardsList,
			visibleCardDataIds,
		);
		if (!deckCardsList) return undefined;
		const aceCard = mergeDeckCardReference(
			stringField(rawDeck, 'ace_card'),
			existingDeck?.aceCard ?? '',
			visibleCardDataIds,
		);
		if (aceCard === undefined) return undefined;
		const deck = {
			deckDataId,
			deckName: stringField(rawDeck, 'deck_name'),
			deckNo,
			generationsId,
			aceCard,
			deckCardsList,
		};
		userDeck.decks = replaceDeck(userDeck.decks, deck);
		modifiedDecks.push(deck);
	}
	return modifiedDecks;
}

export function mergeDeckCardReference(
	requested: string,
	existing: string,
	visibleCardDataIds: ReadonlySet<string>,
): string | undefined {
	if (requested.length > 0)
		return visibleCardDataIds.has(requested) ? requested : undefined;
	return existing.length > 0 && !visibleCardDataIds.has(existing)
		? existing
		: '';
}

function replaceDeck(
	decks: UserDeckDataState[],
	deck: UserDeckDataState,
): UserDeckDataState[] {
	const index = decks.findIndex(
		(current) => current.deckDataId === deck.deckDataId,
	);
	return index < 0
		? [...decks, deck]
		: decks.map((current, currentIndex) =>
				currentIndex === index ? deck : current,
			);
}

function findExistingDeck(
	userDeck: UserDeckState,
	rawDeck: JsonObject,
	deckNo: number,
	generationsId: number,
): UserDeckDataState | undefined {
	const deckDataId = stringField(rawDeck, 'd_deck_datas_id');
	return deckDataId.length > 0
		? userDeck.decks.find((deck) => deck.deckDataId === deckDataId)
		: userDeck.decks.find(
				(deck) =>
					deck.deckNo === deckNo && deck.generationsId === generationsId,
			);
}

function readDeckCards(
	value: unknown,
	existingCards: readonly UserDeckCardState[] = [],
	visibleCardDataIds: ReadonlySet<string>,
): UserDeckCardState[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const cards: UserDeckCardState[] = [];
	for (const card of value) {
		if (!isJsonObject(card)) return undefined;
		const slotNo = numberValue(card.slot_no);
		const deckCardId =
			stringField(card, 'd_deck_cards_id') ||
			findExistingDeckCardId(existingCards, slotNo) ||
			crypto.randomUUID();
		const merged = createUserDeckCardState(
			card,
			deckCardId,
			slotNo,
			existingCards.find((existing) => existing.slot_no === slotNo),
			visibleCardDataIds,
		);
		if (merged === undefined) return undefined;
		cards.push(merged);
	}
	return cards;
}

function findExistingDeckCardId(
	existingCards: readonly UserDeckCardState[],
	slotNo: number,
): string {
	return (
		existingCards.find((card) => card.slot_no === slotNo)?.d_deck_cards_id ?? ''
	);
}

function createUserDeckCardState(
	source: JsonObject,
	deckCardId: string,
	slotNo: number,
	existing: UserDeckCardState | undefined,
	visibleCardDataIds: ReadonlySet<string>,
): UserDeckCardState | undefined {
	const cardDataId = mergeDeckCardReference(
		stringField(source, 'd_card_datas_id'),
		readCardReference(existing, 'd_card_datas_id'),
		visibleCardDataIds,
	);
	const sideStyle1CardDataId = mergeDeckCardReference(
		stringField(source, 'side_style1_d_card_datas_id'),
		readCardReference(existing, 'side_style1_d_card_datas_id'),
		visibleCardDataIds,
	);
	const sideStyle2CardDataId = mergeDeckCardReference(
		stringField(source, 'side_style2_d_card_datas_id'),
		readCardReference(existing, 'side_style2_d_card_datas_id'),
		visibleCardDataIds,
	);
	if (
		cardDataId === undefined ||
		sideStyle1CardDataId === undefined ||
		sideStyle2CardDataId === undefined
	)
		return undefined;
	return createUserDeckCardStateFromIds({
		deckCardId,
		slotNo,
		cardDataId,
		sideStyle1CardDataId,
		sideStyle2CardDataId,
	});
}

function readCardReference(
	card: UserDeckCardState | undefined,
	key:
		| 'd_card_datas_id'
		| 'side_style1_d_card_datas_id'
		| 'side_style2_d_card_datas_id',
): string {
	if (card === undefined) return '';
	if (key === 'd_card_datas_id')
		return 'd_card_datas_id' in card ? card.d_card_datas_id : '';
	if (key === 'side_style1_d_card_datas_id')
		return 'side_style1_d_card_datas_id' in card
			? card.side_style1_d_card_datas_id
			: '';
	return 'side_style2_d_card_datas_id' in card
		? card.side_style2_d_card_datas_id
		: '';
}
