import type { UserRhythmGameGrandPrixDeckCardState } from '../state/rhythm-game-grand-prix-types.ts';

export function projectRhythmGameGrandPrixDeckCards(
	canonical: readonly UserRhythmGameGrandPrixDeckCardState[],
	visibleCardDataIds: ReadonlySet<string>,
): UserRhythmGameGrandPrixDeckCardState[] {
	return canonical.filter((card) => visibleCardDataIds.has(card.dCardDatasId));
}

export function mergeRhythmGameGrandPrixDeckCards(
	canonical: readonly UserRhythmGameGrandPrixDeckCardState[],
	incoming: readonly UserRhythmGameGrandPrixDeckCardState[],
	visibleCardDataIds: ReadonlySet<string>,
): UserRhythmGameGrandPrixDeckCardState[] {
	return [
		...canonical.filter((card) => !visibleCardDataIds.has(card.dCardDatasId)),
		...incoming,
	].sort((left, right) => left.slotNo - right.slotNo);
}
