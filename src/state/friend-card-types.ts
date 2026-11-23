import type { UserCardDataState } from './user-card-types.ts';

export type ProfileFriendCardInfo = Omit<
	UserCardDataState,
	| 'card_sort_order'
	| 'character_bonus'
	| 'generations_id'
	| 'identity_fingerprint'
	| 'source_master_release_id'
> & {
	generations_id: 0;
	card_sort_order: 0;
	character_bonus: {
		character_id: 0;
		music_mastery_bonus: 0;
		love_correction_value: 0;
		music_mastery_bonus_list: null;
		season_fan_level: 0;
	};
};

export type UserFriendCardState = {
	playerId: string;
	schoolIdolStageCardId: string;
	rhythmGameCardId: string;
};

export type FriendCardInfo = {
	card_type: 1 | 2;
	user_card_info: ProfileFriendCardInfo;
};
