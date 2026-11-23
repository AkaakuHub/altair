import type { Database } from 'bun:sqlite';
import { resolveCircleGrandPrixRankingMaster } from '../../application/circle-grand-prix-ranking-service.ts';
import {
	getCircleGrandPrixRankingMasterById,
	getPreviousCircleGrandPrixRankingMaster,
} from '../../master-data/circle-grand-prix-ranking-master.ts';
import { getGrandPrixRankingMasterFromDatabase } from '../../master-data/grand-prix-ranking-master.ts';
import type { CircleState } from '../../state/circle-types.ts';
import {
	findGrandPrixRankingState,
	getGrandPrixCircleRanking,
} from '../../state/grand-prix-ranking-aggregate.ts';
import type {
	CircleMemberRankingResponse,
	CircleRankingInfoResponse,
} from '../response-types/circle-response-types.ts';
import type { CircleProfilePartsSource } from './circle-response-common.ts';
import { createProfileIconPartsInfo } from './profile-icon-parts-response.ts';

export function createCircleRankingInfo(
	database: Database,
	circle: CircleState,
	source: CircleProfilePartsSource,
): CircleRankingInfoResponse {
	const rankingMaster = resolveCircleGrandPrixRankingMaster(
		source.grandPrix,
		{
			findById: (grandPrixId) =>
				getCircleGrandPrixRankingMasterById(database, grandPrixId),
			findPrevious: (startDate) =>
				getPreviousCircleGrandPrixRankingMaster(database, startDate),
		},
		new Date(),
	);
	const ranking = findGrandPrixRankingState(
		source,
		rankingMaster.grandPrixId,
		getGrandPrixRankingMasterFromDatabase(database, rankingMaster.grandPrixId)
			.identityFingerprint,
	);
	const circleRanking = getGrandPrixCircleRanking(ranking, circle);
	return {
		name: rankingMaster.name,
		rank: circleRanking?.rank ?? 0,
		month: rankingMaster.month,
		point: circleRanking?.point ?? 0,
		member_ranking_list: createCircleMemberRankingList(
			circle,
			source,
			circleRanking,
		),
	};
}

function createCircleMemberRankingList(
	circle: CircleState,
	source: CircleProfilePartsSource,
	circleRanking: ReturnType<typeof getGrandPrixCircleRanking>,
): CircleMemberRankingResponse[] {
	if (circleRanking === undefined) {
		return [];
	}
	return circleRanking.memberRankings
		.flatMap((memberRanking) => {
			const member = circle.members.find(
				(circleMember) => circleMember.playerId === memberRanking.playerId,
			);
			const user = source.registeredUsers.find(
				(registeredUser) => registeredUser.playerId === memberRanking.playerId,
			);
			if (!member || !user) {
				return [];
			}
			return [
				{
					player_id: user.playerId,
					player_name: user.playerName,
					user_type: 2,
					profile_icon_parts_info: createProfileIconPartsInfo(
						source,
						user.playerId,
					),
					rank: memberRanking.rank,
					point: memberRanking.point,
					is_mute_player: false,
				},
			];
		})
		.sort((left, right) => left.rank - right.rank);
}
