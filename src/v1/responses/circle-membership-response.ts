import type { CircleState } from '../../state/circle-types.ts';
import type {
	CircleGetInfoResponse,
	CircleInviteAndJoinInfoResponse,
	CircleInviteListResponse,
	CircleJoinInfoResponse,
} from '../response-types/circle-response-types.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import {
	type CircleProfilePartsSource,
	createCircleInfo,
	createEmptyCircleRankingInfo,
} from './circle-response-common.ts';
import {
	createProfileCardPartsInfo,
	createProfileIconPartsInfo,
} from './profile-icon-parts-response.ts';

export function createCircleInviteAndJoinInfoResponse(
	circle: CircleState | null,
	source: CircleProfilePartsSource,
): CircleInviteAndJoinInfoResponse {
	return {
		invite_info_list: [],
		join_info_list: createCircleJoinInfoList(circle, source),
	};
}

export function createCircleSetCreateResponse(
	circle: CircleState,
): CircleGetInfoResponse {
	const circleInfo = createCircleInfo(circle, createEmptyCircleRankingInfo());
	circleInfo.is_join_guild_ranking = false;
	return { circle_info: circleInfo };
}

export function createCircleSetSettingResponse(
	result: boolean,
): ResultResponse {
	return { result };
}

export function createCircleInviteListResponse(): CircleInviteListResponse {
	return { invitations_list: [] };
}

export function hasCircleInviteListItems(): boolean {
	return createCircleInviteListResponse().invitations_list.length > 0;
}

function createCircleJoinInfoList(
	circle: CircleState | null,
	source: CircleProfilePartsSource,
): CircleJoinInfoResponse[] {
	if (!circle) {
		return [];
	}
	return circle.joinRequests.flatMap((request) => {
		const user = source.registeredUsers.find(
			(registeredUser) => registeredUser.playerId === request.playerId,
		);
		return user
			? [
					{
						create_time: request.createTime,
						d_guild_invitations_id: request.guildInvitationId,
						is_mute_player: false,
						last_login_date_time: user.lastLoginDate,
						player_id: user.playerId,
						player_level: user.playerLevel,
						player_name: user.playerName,
						profile_card_parts_info: createProfileCardPartsInfo(
							source,
							user.playerId,
						),
						profile_icon_parts_info: createProfileIconPartsInfo(
							source,
							user.playerId,
						),
						user_type: 2,
					},
				]
			: [];
	});
}
