import type { ProfileFriendCardInfo } from '../../state/friend-card-types.ts';
import type { UserCardDataResponse } from './user-card-deck-response-types.ts';

export type LiveChatGroupListResponse = {
	group_x: [];
	group_y: [];
};

type MutePlayerResponse = {
	player_id: string;
};

export type MuteListResponse = {
	mute_list: MutePlayerResponse[];
};

export type FriendCardInfoEntryResponse = {
	card_type: 1 | 2;
	user_card_info: ProfileFriendCardInfo;
};

export type FriendCardInfoResponse = FriendCardInfoEntryResponse[];

export type FollowInfoResponse = {
	comment: string;
	fan_level: number;
	follow_status: number;
	follower_status: number;
	friend_card_info: FriendCardInfoResponse;
	last_login_date_time: string | null;
	name: string;
	player_id: string;
	profile_icon_parts_info: string;
};

export type FollowListResponse = {
	follow_info_list: FollowInfoResponse[];
	max_follow_count: number;
};

export type FollowerListResponse = {
	follower_info_list: FollowInfoResponse[];
	max_follower_count: number;
};

export type FollowRecommendListResponse = {
	max_recommend_count: number;
	recommend_info_list: FollowInfoResponse[];
};

export type QuestLiveFriendCardResponse = {
	player_id: string;
	name: string;
	fan_level: number;
	profile_icon_parts_info: string;
	friend_status: number;
	friend_card_info: UserCardDataResponse;
};
