import type { UserRhythmGameGrandPrixDeckCardState } from '../../state/rhythm-game-grand-prix-types.ts';
import {
	getStringField,
	isJsonRecord,
} from '../route-support/request-fields.ts';
import { numberValue } from './json-utils.ts';

export function readRhythmGameGrandPrixDeckCardList(
	value: unknown[],
	currentDeckCardList: UserRhythmGameGrandPrixDeckCardState[],
	createId: () => string = crypto.randomUUID,
): UserRhythmGameGrandPrixDeckCardState[] {
	return value
		.filter(isJsonRecord)
		.map((card) => {
			const slotNo = numberValue(card.slot_no);
			const dCardDatasId = getStringField(card, 'd_card_datas_id');
			const existing =
				currentDeckCardList.find(
					(current) => current.dCardDatasId === dCardDatasId,
				) ?? currentDeckCardList.find((current) => current.slotNo === slotNo);
			return {
				seriesDeckCardDatasId: existing?.seriesDeckCardDatasId ?? createId(),
				dCardDatasId,
				slotNo,
				isCenter: card.is_center === true,
			};
		})
		.sort((left, right) => left.slotNo - right.slotNo);
}

export function readRhythmGameGrandPrixPositionList(
	value: unknown[],
): Map<string, number> {
	const positions = new Map<string, number>();
	for (const item of value) {
		if (!isJsonRecord(item)) continue;
		const id = getStringField(item, 'series_deck_card_datas_id');
		if (id.length > 0) positions.set(id, numberValue(item.slot_no));
	}
	return positions;
}
