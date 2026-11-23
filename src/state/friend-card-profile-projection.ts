import type {
	FriendCardInfo,
	ProfileFriendCardInfo,
	UserFriendCardState,
} from './friend-card-types.ts';
import {
	findUserCard,
	type UserCardCollectionState,
} from './user-card-aggregate-state.ts';
import type { UserCardDataState } from './user-card-types.ts';

export function createFriendCardInfo(
	state: { userFriendCards: UserFriendCardState[] },
	cards: UserCardCollectionState,
	playerId: string,
): FriendCardInfo[] {
	const friendCard = state.userFriendCards.find(
		(value) => value.playerId === playerId,
	);
	if (!friendCard) return [];
	return [
		createFriendCardInfoEntry(cards, 1, friendCard.schoolIdolStageCardId),
		createFriendCardInfoEntry(cards, 2, friendCard.rhythmGameCardId),
	].filter((entry) => entry !== undefined);
}

function createFriendCardInfoEntry(
	cards: UserCardCollectionState,
	cardType: 1 | 2,
	dCardDatasId: string,
): FriendCardInfo | undefined {
	if (dCardDatasId.length === 0) return undefined;
	const card = findUserCard(cards, dCardDatasId);
	return card
		? { card_type: cardType, user_card_info: createProfileFriendCardInfo(card) }
		: undefined;
}

function createProfileFriendCardInfo(
	card: UserCardDataState,
): ProfileFriendCardInfo {
	const responseCard = structuredClone(card);
	delete responseCard.source_master_release_id;
	delete responseCard.identity_fingerprint;
	return {
		...responseCard,
		generations_id: 0,
		card_sort_order: 0,
		character_bonus: {
			character_id: 0,
			music_mastery_bonus: 0,
			love_correction_value: 0,
			music_mastery_bonus_list: null,
			season_fan_level: 0,
		},
	};
}
