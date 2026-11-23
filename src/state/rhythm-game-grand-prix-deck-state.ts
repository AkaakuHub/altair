import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';
import type { UserRhythmGameGrandPrixState } from './rhythm-game-grand-prix-types.ts';

export function resetRhythmGameGrandPrixDecks(
	grandPrix: UserRhythmGameGrandPrixState,
	visibleCardDataIds: ReadonlySet<string>,
	identities?: ReadonlyMap<number, EntityIdentityFingerprint>,
): void {
	grandPrix.seriesProgressList = grandPrix.seriesProgressList.map(
		(progress) => {
			const target = identities?.get(progress.grandPrixRhythmGameSeriesId);
			if (
				target !== undefined &&
				progress.identityFingerprint !== undefined &&
				!isSameEntityIdentity(progress.identityFingerprint, target)
			)
				return progress;
			return {
				...progress,
				deckCardList: progress.deckCardList.filter(
					(card) => !visibleCardDataIds.has(card.dCardDatasId),
				),
			};
		},
	);
}
