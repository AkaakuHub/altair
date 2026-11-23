import type { UserRhythmGameGrandPrixDeckCardState } from '../../state/rhythm-game-grand-prix-types.ts';
import type {
	RhythmGameGrandPrixDeckCardInfoResponse,
	RhythmGameGrandPrixEmptyResponse,
} from './rhythm-game-grand-prix-types.ts';
import type { StoredResponse } from './types.ts';

export function createRhythmGameGrandPrixDeckCardInfoList(
	deckCardList: UserRhythmGameGrandPrixDeckCardState[],
): RhythmGameGrandPrixDeckCardInfoResponse[] {
	return [...deckCardList]
		.sort((left, right) => left.slotNo - right.slotNo)
		.map((card) => ({
			series_deck_card_datas_id: card.seriesDeckCardDatasId,
			d_card_datas_id: card.dCardDatasId,
			slot_no: card.slotNo,
			is_center: card.isCenter,
		}));
}

export function createRhythmGameGrandPrixDeckCardListResponse(
	deckCardList: UserRhythmGameGrandPrixDeckCardState[],
): StoredResponse {
	return {
		body: {
			deck_card_list: createRhythmGameGrandPrixDeckCardInfoList(deckCardList),
		},
		statusCode: 200,
	};
}

export function createRhythmGameGrandPrixEmptyResponse(): StoredResponse & {
	body: RhythmGameGrandPrixEmptyResponse;
} {
	return { body: {}, statusCode: 200 };
}
