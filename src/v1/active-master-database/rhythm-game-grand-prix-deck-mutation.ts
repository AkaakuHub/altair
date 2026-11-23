import {
	mergeRhythmGameGrandPrixDeckCards,
	projectRhythmGameGrandPrixDeckCards,
} from '../../application/rhythm-game-grand-prix-deck-projection.ts';
import type { UserRhythmGameGrandPrixDeckCardState } from '../../state/rhythm-game-grand-prix-types.ts';

export function setVisibleRhythmGameGrandPrixDeckCenter(
	canonical: readonly UserRhythmGameGrandPrixDeckCardState[],
	visibleCardDataIds: ReadonlySet<string>,
	slotNo: number,
): {
	canonical: UserRhythmGameGrandPrixDeckCardState[];
	visible: UserRhythmGameGrandPrixDeckCardState[];
} {
	const visible = projectRhythmGameGrandPrixDeckCards(
		canonical,
		visibleCardDataIds,
	).map((card) => ({ ...card, isCenter: card.slotNo === slotNo }));
	return {
		visible,
		canonical: mergeRhythmGameGrandPrixDeckCards(
			canonical,
			visible,
			visibleCardDataIds,
		),
	};
}

export function setVisibleRhythmGameGrandPrixDeckPositions(
	canonical: readonly UserRhythmGameGrandPrixDeckCardState[],
	visibleCardDataIds: ReadonlySet<string>,
	positions: ReadonlyMap<string, number>,
): {
	canonical: UserRhythmGameGrandPrixDeckCardState[];
	visible: UserRhythmGameGrandPrixDeckCardState[];
} {
	const visible = projectRhythmGameGrandPrixDeckCards(
		canonical,
		visibleCardDataIds,
	)
		.map((card) => ({
			...card,
			slotNo: positions.get(card.seriesDeckCardDatasId) ?? card.slotNo,
		}))
		.sort((left, right) => left.slotNo - right.slotNo);
	return {
		visible,
		canonical: mergeRhythmGameGrandPrixDeckCards(
			canonical,
			visible,
			visibleCardDataIds,
		),
	};
}
