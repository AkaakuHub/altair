import type { UserStatusController } from '../../application/user-status-controller.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import type { MemberFanLevelState } from '../../state/user-status-types.ts';
import type {
	FanLevelRankingEntry,
	FanLevelRankingResponse,
} from './profile-fan-level-response-types.ts';
import { createProfileIconPartsInfo } from './profile-icon-parts-response.ts';

export function createFanLevelRankingResponse(
	state: ServerState,
	requestUser: RegisteredUserState,
	characterId: number,
	userStatus: UserStatusController,
): FanLevelRankingResponse {
	const rankings = state.registeredUsers
		.map((user) =>
			createFanLevelRankingCandidate(state, user, characterId, userStatus),
		)
		.filter((ranking) => ranking !== null)
		.sort((left, right) =>
			right.member_fan_level === left.member_fan_level
				? left.player_id.localeCompare(right.player_id)
				: right.member_fan_level - left.member_fan_level,
		)
		.map((ranking, index) => ({ ...ranking, rank: index + 1 }));
	const requestUserRanking = rankings.find(
		(ranking) => ranking.player_id === requestUser.playerId,
	);
	return {
		my_rank: requestUserRanking?.rank ?? 0,
		my_member_fan_level: memberFanLevelForCharacter(
			userStatus.getMemberFanLevels(
				userStatus.ensure(state, requestUser.playerId).value,
			),
			characterId,
		),
		rankings,
	};
}

function createFanLevelRankingCandidate(
	state: ServerState,
	user: RegisteredUserState,
	characterId: number,
	userStatus: UserStatusController,
): FanLevelRankingEntry | null {
	const status = state.userStatuses.find(
		(entry) => entry.playerId === user.playerId,
	);
	if (
		status === undefined ||
		!state.userProfileDesigns.some(
			(profile) => profile.playerId === user.playerId,
		)
	)
		return null;
	return {
		rank: 0,
		player_id: user.playerId,
		player_name: user.playerName,
		profile_icon_parts_info: createProfileIconPartsInfo(state, user.playerId),
		member_fan_level: memberFanLevelForCharacter(
			userStatus.getMemberFanLevels(status),
			characterId,
		),
	};
}

function memberFanLevelForCharacter(
	memberFanLevels: MemberFanLevelState[],
	characterId: number,
): number {
	return (
		memberFanLevels.find((row) => row.characterId === characterId)
			?.memberFanLevel ?? 0
	);
}
