export type {
	UserCredentialsResponse as RegisteredUserResponse,
	UserLoginResponse,
} from '../src/v1/response-types/account-response-types.ts';

export type LoginBonusResponse = {
	event_login_bonus_list: LoginBonusEntry[];
	login_bonus_list: LoginBonusEntry[];
};

export type LoginBonusEntry = {
	login_bonus_id: number;
	datas: LoginBonusData[];
};

type LoginBonusData = {
	is_now_get: boolean;
	count: number;
};

export type ProfileInfo = {
	player_id: string;
	player_name: string;
	fan_level: number;
	grade_live_clear_num: number;
	grade_live_top_clear_num: number;
	grade_live_max_num: number;
	profile_card_parts_info: string;
	profile_icon_parts_info: string;
	dream_style_num: number;
	guild_name?: string;
	search_guild_key?: string;
	fan_level_list: Array<{
		character_id: number;
		d_season_fan_level: number;
		member_fan_level: number;
	}>;
};
