import type { JsonValue } from '../../state/json-state-utils.ts';

export type RhythmGameDeckSetDeckNameRequest = {
	name: string;
	deck_no: number;
};

export type RhythmGameDeckModifyRequest = {
	modify_deck_list: {
		deck_no?: number;
		name?: string;
		deck_card_list?: JsonValue[];
	}[];
};
