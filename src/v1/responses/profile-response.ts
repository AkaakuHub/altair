import type { RegisteredUserState } from '../../server-state-schema.ts';
import type { FriendCardInfo } from '../../state/friend-card-types.ts';
import type {
	ProfileCircleInfo,
	ProfileDesignEntry,
	ProfileFollowStatus,
	ProfileFriendRequestStatus,
	UserProfileDesignState,
} from '../../state/profile-design-state.ts';
import { getSelectedProfileDesignPartsInfoForOfficialResponse } from '../../state/profile-design-state.ts';
import type { UserProfileSettingsState } from '../../state/profile-settings-state.ts';
import type {
	ProfileStatsMaster,
	ProfileUserProgressStats,
} from '../../state/profile-stats-master.ts';
import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import type { UserIconFrameState } from '../../state/user-item-definition.ts';
import type { ProfileDesignListResponse } from '../response-types/profile-response-types.ts';

type FanLevelEntry = {
	character_id: number;
	d_season_fan_level: number;
	member_fan_level: number;
};

export type ProfileInfo = {
	player_name: string;
	user_type: number;
	profile_icon_parts_info: string;
	profile_card_parts_info: string;
	fan_level: number;
	birthday: string;
	is_birthday_changeable: boolean;
	entry_time: string;
	player_id: string;
	comment: string;
	last_login_date: string;
	search_guild_key: string;
	guild_name: string;
	sticker_num: number;
	card_num: number;
	dream_style_num: number;
	friend_num: number;
	friend_max_num: number;
	music_num: number;
	music_max_num: number;
	standard_live_clear_num: number;
	standard_live_top_clear_num: number;
	standard_live_max_num: number;
	standard_live_star_total_num: number;
	grade_live_clear_num: number;
	grade_live_series_top_clear_rank_list: [];
	grade_live_top_clear_num: number;
	grade_live_max_num: number;
	fan_level_list: FanLevelEntry[];
	friend_card_info: FriendCardInfo[];
};

export type HomeCustomSettingResponse = {
	sticker_info_list: number[];
	user_card_data_list: number[];
	user_icon_frame: UserIconFrameState[];
	profile_info: ProfileInfo;
};

export type ProfileInfoResponse = {
	circle_invite_status: number;
	friend_request_status: number;
	follow_status: number;
	is_mute: boolean;
	is_own: boolean;
	is_report: boolean;
	profile_info: ProfileInfo;
};

export function createProfileDesignListResponse(
	designList: ProfileDesignEntry[],
): ProfileDesignListResponse {
	return {
		my_design_list: designList.map(cloneProfileDesignEntry),
	};
}

export function createHomeCustomSettingResponse(
	design: UserProfileDesignState,
	user: RegisteredUserState,
	cards: UserCardCollectionState,
	profileStats: ProfileStatsMaster,
	userProgressStats: ProfileUserProgressStats,
	fanLevel: number,
	fanLevelList: FanLevelEntry[],
	settings: UserProfileSettingsState,
	circleInfo: ProfileCircleInfo,
	stickerIds: number[],
	userIconFrames: UserIconFrameState[],
	friendCardInfo: FriendCardInfo[],
	homeCustomCardDatasIds: number[],
): HomeCustomSettingResponse {
	return {
		sticker_info_list: [...stickerIds],
		user_card_data_list: [...homeCustomCardDatasIds],
		user_icon_frame: userIconFrames,
		profile_info: createProfileInfo(
			design,
			user,
			cards,
			profileStats,
			userProgressStats,
			fanLevel,
			fanLevelList,
			settings.comment,
			circleInfo,
			stickerIds.length,
			friendCardInfo,
		),
	};
}

export function createProfileInfoResponse(
	profileInfo: ProfileInfo,
	isOwn: boolean,
	friendRequestStatus: ProfileFriendRequestStatus,
	followStatus: ProfileFollowStatus,
	isMute: boolean,
	isReport: boolean,
): ProfileInfoResponse {
	return {
		circle_invite_status: 0,
		friend_request_status: friendRequestStatus,
		follow_status: followStatus,
		is_mute: isMute,
		is_own: isOwn,
		is_report: isReport,
		profile_info: profileInfo,
	};
}

export function createProfileInfo(
	design: UserProfileDesignState,
	user: RegisteredUserState,
	cards: UserCardCollectionState,
	profileStats: ProfileStatsMaster,
	userProgressStats: ProfileUserProgressStats,
	fanLevel: number,
	fanLevelList: FanLevelEntry[],
	comment: string,
	circleInfo: ProfileCircleInfo,
	stickerNum: number,
	friendCardInfo: FriendCardInfo[],
	profileIconPartsInfo = getSelectedProfileDesignPartsInfoForOfficialResponse(
		design,
		2,
	),
): ProfileInfo {
	return {
		player_name: user.playerName,
		user_type: 2,
		profile_icon_parts_info: profileIconPartsInfo,
		profile_card_parts_info:
			getSelectedProfileDesignPartsInfoForOfficialResponse(design, 1),
		fan_level: fanLevel,
		birthday: user.birthday,
		is_birthday_changeable: false,
		entry_time: user.entryTime,
		player_id: user.playerId,
		comment,
		last_login_date: user.lastLoginDate,
		search_guild_key: circleInfo.searchGuildKey,
		guild_name: circleInfo.guildName,
		sticker_num: stickerNum,
		card_num: cards.userCardDataList.length,
		dream_style_num: profileStats.dreamStyleNum,
		friend_num: 0,
		friend_max_num: 30,
		music_num: userProgressStats.musicNum,
		music_max_num: profileStats.musicMaxNum,
		standard_live_clear_num: userProgressStats.standardLiveClearNum,
		standard_live_top_clear_num: 0,
		standard_live_max_num: profileStats.standardLiveMaxNum,
		standard_live_star_total_num: 0,
		grade_live_clear_num: userProgressStats.gradeLiveClearNum,
		grade_live_series_top_clear_rank_list: [],
		grade_live_top_clear_num: 0,
		grade_live_max_num: 0,
		fan_level_list: fanLevelList,
		friend_card_info: friendCardInfo,
	};
}

function cloneProfileDesignEntry(
	entry: ProfileDesignEntry,
): ProfileDesignEntry {
	return { ...entry };
}
