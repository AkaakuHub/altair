import type { UserFriendCardState } from './friend-card-types.ts';

export function setUserFriendCard(
	state: { userFriendCards: UserFriendCardState[] },
	visibleCardDataIds: ReadonlySet<string>,
	playerId: string,
	schoolIdolStageCardId: string,
	rhythmGameCardId: string,
): boolean {
	const existingIndex = state.userFriendCards.findIndex(
		(friendCard) => friendCard.playerId === playerId,
	);
	const existing = state.userFriendCards[existingIndex];
	const nextSchoolIdolStageCardId = mergeFriendCardReference(
		schoolIdolStageCardId,
		existing?.schoolIdolStageCardId ?? '',
		visibleCardDataIds,
	);
	const nextRhythmGameCardId = mergeFriendCardReference(
		rhythmGameCardId,
		existing?.rhythmGameCardId ?? '',
		visibleCardDataIds,
	);
	if (
		nextSchoolIdolStageCardId === undefined ||
		nextRhythmGameCardId === undefined
	)
		return false;
	const nextFriendCard = {
		playerId,
		schoolIdolStageCardId: nextSchoolIdolStageCardId,
		rhythmGameCardId: nextRhythmGameCardId,
	};
	if (existingIndex === -1) state.userFriendCards.push(nextFriendCard);
	else state.userFriendCards[existingIndex] = nextFriendCard;
	return true;
}

export function mergeFriendCardReference(
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
