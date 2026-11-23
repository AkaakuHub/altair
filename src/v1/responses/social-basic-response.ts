import type { UserSocialState } from '../../state/social-types.ts';
import type { ResultCodeResponse } from '../response-types/common-response-types.ts';
import type {
	LiveChatGroupListResponse,
	MuteListResponse,
} from '../response-types/follow-response-types.ts';

export function createFollowSearchMissResponse(): ResultCodeResponse {
	return { resultCode: 1 };
}

export function createLiveChatGroupListResponse(): LiveChatGroupListResponse {
	return { group_x: [], group_y: [] };
}

export function createMuteListResponse(
	social: UserSocialState,
): MuteListResponse {
	return {
		mute_list: social.mutePlayerIds.map((playerId) => ({
			player_id: playerId,
		})),
	};
}
