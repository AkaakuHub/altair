import type { UserDeckCardState } from '../../state/user-deck-definition.ts';

export type UserCardDetailRequest = { d_card_datas_id: string };
export type UserDeckModification = {
	d_deck_datas_id?: string;
	deck_name?: string;
	deck_no?: number;
	generations_id?: number;
	ace_card?: string;
	deck_cards_list: Partial<UserDeckCardState>[];
};
export type UserDeckModifyRequest = {
	modify_deck_list: UserDeckModification[];
};
