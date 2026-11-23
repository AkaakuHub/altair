import type { ProfileTargetRequest } from './profile-request-types.ts';

export type CircleSearchRequest = { search_conditions?: string };
export type CircleKeyRequest = { search_guild_key: string };
export type CircleInvitationRequest = { d_guild_invitations_id: string };
export type CirclePositionRequest = ProfileTargetRequest & {
	position_type: number;
};
export type CircleChatLogQuery = { diff_order_id?: number };
export type CircleCreateRequest = {
	/** @examples ["{\"guild_name\":\"Sample Circle\",\"guild_comment\":\"Sample description\",\"guild_policy_action\":1,\"guild_policy_recruiting\":2,\"guild_icon_parts_info\":\"{}\"}"] */
	guild_setting: string;
};
export type CircleSettingRequest = CircleCreateRequest & CircleKeyRequest;
export type CircleChatMessageRequest = {
	/** @examples ["{\"chat_comment\":\"Sample message\"}"] */
	guild_chat_info: string;
};
