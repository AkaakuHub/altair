import type { Database } from 'bun:sqlite';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { findCircleJoinRequestIdByPlayer } from '../../state/circle-join-state.ts';
import type { CircleState } from '../../state/circle-types.ts';
import type {
	CircleDetailResponse,
	CircleGetInfoResponse,
	CircleListResponse,
	CircleTopInfoResponse,
} from '../response-types/circle-response-types.ts';
import { createCircleRankingInfo } from './circle-ranking-response.ts';
import {
	type CircleProfilePartsSource,
	createCircleInfo,
	createCircleMembers,
	createEmptyCircleInfo,
	createEmptyCircleRankingInfo,
} from './circle-response-common.ts';

export type CircleSearchConditions = {
	guildName: string;
	guildMemberNum: number | null;
	guildPolicyAction: number | null;
	guildPolicyRecruiting: number | null;
	pageNum: number;
};

export function createCircleTopInfoResponse(
	database: Database,
	circle: CircleState | null,
	user: RegisteredUserState,
	source: CircleProfilePartsSource,
): CircleTopInfoResponse {
	if (!circle?.members.some((member) => member.playerId === user.playerId)) {
		return {
			circle_info: createEmptyCircleInfo(),
			circle_member_list: [],
			circle_ranking_info: createEmptyCircleRankingInfo(),
			emoji_list: [],
			item_request_result: { item_id: 0, num: 0 },
			membership_list: [],
		};
	}
	return {
		circle_info: createCircleInfo(circle, createEmptyCircleRankingInfo()),
		circle_member_list: createCircleMembers(circle, source),
		circle_ranking_info: createCircleRankingInfo(database, circle, source),
		emoji_list: [],
		item_request_result: { item_id: 0, num: 0 },
		membership_list: [],
	};
}

export function createCircleListResponse(
	circle: CircleState | null,
	conditions: CircleSearchConditions,
): CircleListResponse {
	if (circle && matchesCircleSearchConditions(circle, conditions)) {
		return {
			circle_info_list: [
				createCircleInfo(circle, createEmptyCircleRankingInfo()),
			],
			page_num: conditions.pageNum,
			total_page: 1,
		};
	}
	return { circle_info_list: [], page_num: conditions.pageNum, total_page: 0 };
}

export function matchesCircleSearchConditions(
	circle: CircleState,
	conditions: CircleSearchConditions,
): boolean {
	return (
		(conditions.guildName.length === 0 ||
			circle.guildName
				.toLowerCase()
				.includes(conditions.guildName.toLowerCase())) &&
		matchesNumberCondition(circle.members.length, conditions.guildMemberNum) &&
		matchesNumberCondition(
			circle.guildPolicyAction,
			conditions.guildPolicyAction,
		) &&
		matchesNumberCondition(
			circle.guildPolicyRecruiting,
			conditions.guildPolicyRecruiting,
		)
	);
}

function matchesNumberCondition(
	value: number,
	condition: number | null,
): boolean {
	return condition === null || value === condition;
}

export function createCircleDetailResponse(
	database: Database,
	circle: CircleState | null,
	source: CircleProfilePartsSource,
	searchGuildKey: string,
): CircleDetailResponse {
	if (!circle || circle.searchGuildKey !== searchGuildKey) {
		return {
			circle_info: createEmptyCircleInfo(),
			circle_member_list: [],
			circle_ranking_info: createEmptyCircleRankingInfo(),
		};
	}
	return {
		circle_info: createCircleInfo(circle, createEmptyCircleRankingInfo()),
		circle_member_list: createCircleMembers(circle, source),
		circle_ranking_info: createCircleRankingInfo(database, circle, source),
	};
}

export function createCircleGetInfoResponse(
	circle: CircleState | null,
	user: RegisteredUserState,
	searchGuildKey: string,
): CircleGetInfoResponse {
	if (!circle || circle.searchGuildKey !== searchGuildKey) {
		return { circle_info: createEmptyCircleInfo() };
	}
	const circleInfo = createCircleInfo(circle, createEmptyCircleRankingInfo());
	circleInfo.d_guild_invitations_id = findCircleJoinRequestIdByPlayer(
		circle,
		user.playerId,
	);
	circleInfo.is_join_guild_ranking = false;
	return { circle_info: circleInfo };
}
