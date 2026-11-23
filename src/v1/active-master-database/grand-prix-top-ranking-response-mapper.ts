import type { ServerState } from '../../server-state-schema.ts';
import type { CircleState } from '../../state/circle-types.ts';
import { getGrandPrixCircleRanking } from '../../state/grand-prix-ranking-aggregate.ts';
import type { GrandPrixRankingState } from '../../state/grand-prix-ranking-definition.ts';
import { createProfileIconPartsInfo } from '../responses/profile-icon-parts-response.ts';

type GrandPrixRankingSource = Pick<
	ServerState,
	'registeredUsers' | 'userProfileDesigns'
>;

type GrandPrixPointRanking = {
	id: string;
	name: string;
	user_type: number;
	icon_parts_info: string;
	rank: number;
	point: number;
	is_mute_player: boolean;
};

export function mapGrandPrixPersonalRankings(
	ranking: GrandPrixRankingState | undefined,
	state: GrandPrixRankingSource,
): GrandPrixPointRanking[] {
	return (
		ranking?.personalRankings.map((personalRanking) => {
			const user = state.registeredUsers.find(
				(registeredUser) =>
					registeredUser.playerId === personalRanking.playerId,
			);
			return {
				id: personalRanking.playerId,
				name: user?.playerName ?? personalRanking.playerId,
				user_type: 2,
				icon_parts_info: createProfileIconPartsInfo(
					state,
					personalRanking.playerId,
				),
				rank: personalRanking.rank,
				point: personalRanking.point,
				is_mute_player: false,
			};
		}) ?? []
	);
}

export function mapGrandPrixCircleRankings(
	ranking: GrandPrixRankingState | undefined,
	circle: CircleState | null,
): GrandPrixPointRanking[] {
	const circleRanking = getGrandPrixCircleRanking(ranking, circle);
	if (circle === null || circleRanking === undefined) return [];
	return [
		{
			id: circle.searchGuildKey,
			name: circle.guildName,
			user_type: 0,
			icon_parts_info: circle.guildIconPartsInfo,
			rank: circleRanking.rank,
			point: circleRanking.point,
			is_mute_player: false,
		},
	];
}

export function mapGrandPrixRankingListResponse(
	status: number,
	myRank: number,
	pointRankings: GrandPrixPointRanking[],
) {
	return {
		body: {
			status,
			my_rank: myRank,
			lowest_rank: pointRankings.at(-1)?.rank ?? (myRank > 0 ? myRank : 0),
			point_rankings: pointRankings,
			circle_high_score_rankings: [] satisfies [],
		},
		statusCode: 200,
	};
}
