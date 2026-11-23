export type UserDeckState = { playerId: string; decks: UserDeckDataState[] };

export type UserDeckDataState = {
	deckDataId: string;
	deckName: string;
	deckNo: number;
	generationsId: number;
	aceCard: string;
	deckCardsList: UserDeckCardState[];
};

type EmptyUserDeckCardState = { d_deck_cards_id: string; slot_no: number };
type MainUserDeckCardState = EmptyUserDeckCardState & {
	d_card_datas_id: string;
};
type SideStyle1UserDeckCardState = EmptyUserDeckCardState & {
	side_style1_d_card_datas_id: string;
};
type SideStyle2UserDeckCardState = EmptyUserDeckCardState & {
	side_style2_d_card_datas_id: string;
};

export type UserDeckCardState =
	| EmptyUserDeckCardState
	| MainUserDeckCardState
	| SideStyle1UserDeckCardState
	| SideStyle2UserDeckCardState
	| (MainUserDeckCardState & SideStyle1UserDeckCardState)
	| (MainUserDeckCardState & SideStyle2UserDeckCardState)
	| (SideStyle1UserDeckCardState & SideStyle2UserDeckCardState)
	| (MainUserDeckCardState &
			SideStyle1UserDeckCardState &
			SideStyle2UserDeckCardState);

export function createUserDeckCardStateFromIds(input: {
	deckCardId: string;
	slotNo: number;
	cardDataId: string;
	sideStyle1CardDataId: string;
	sideStyle2CardDataId: string;
}): UserDeckCardState {
	const base = { d_deck_cards_id: input.deckCardId, slot_no: input.slotNo };
	if (
		input.cardDataId.length > 0 &&
		input.sideStyle1CardDataId.length > 0 &&
		input.sideStyle2CardDataId.length > 0
	)
		return {
			...base,
			d_card_datas_id: input.cardDataId,
			side_style1_d_card_datas_id: input.sideStyle1CardDataId,
			side_style2_d_card_datas_id: input.sideStyle2CardDataId,
		};
	if (input.cardDataId.length > 0 && input.sideStyle1CardDataId.length > 0)
		return {
			...base,
			d_card_datas_id: input.cardDataId,
			side_style1_d_card_datas_id: input.sideStyle1CardDataId,
		};
	if (input.cardDataId.length > 0 && input.sideStyle2CardDataId.length > 0)
		return {
			...base,
			d_card_datas_id: input.cardDataId,
			side_style2_d_card_datas_id: input.sideStyle2CardDataId,
		};
	if (
		input.sideStyle1CardDataId.length > 0 &&
		input.sideStyle2CardDataId.length > 0
	)
		return {
			...base,
			side_style1_d_card_datas_id: input.sideStyle1CardDataId,
			side_style2_d_card_datas_id: input.sideStyle2CardDataId,
		};
	if (input.cardDataId.length > 0)
		return { ...base, d_card_datas_id: input.cardDataId };
	if (input.sideStyle1CardDataId.length > 0)
		return { ...base, side_style1_d_card_datas_id: input.sideStyle1CardDataId };
	if (input.sideStyle2CardDataId.length > 0)
		return { ...base, side_style2_d_card_datas_id: input.sideStyle2CardDataId };
	return base;
}
