import type { TutorialStatusResponse } from '../../state/user-tutorial-state.ts';

export type UserCredentialsResponse = {
	device_specific_id: string;
	player_id: string;
	session_token: string;
};

export type RegisterTermsResponse = { terms: string };
export type ApproveTermsResponse = UserCredentialsResponse & { type: number };
export type RegisterUserRequest = { name?: string; platform_type?: number };
export type SetUserDataRequest = { name?: string };
export type UserLoginRequest = {
	player_id?: string;
	device_specific_id?: string;
};

export type UserLoginResponse = {
	is_login_bonus_receive: boolean;
	is_term_update: boolean;
	is_tutorial: boolean;
	item_store_product_id_list: string[];
	membership_product_id_list: string[];
	push_device_token: string;
	session_token: string;
	sisca_product_id_list: string[];
	tutorials_status_list: TutorialStatusResponse[];
	type: number;
};

export type SetAccountConnectDataRequest = {
	id_token: string;
	platform_type?: number;
	provider: 1;
};
export type AccountConnectRequest = SetAccountConnectDataRequest & {
	player_id: string;
};
export type AccountConnectResponse = UserCredentialsResponse & {
	player_level: number;
	player_name: string;
};
export type SetTutorialStepRequest = { tutorial_id?: number };
export type SetPushDeviceTokenRequest = { token?: string };
