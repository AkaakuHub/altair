import type { Database } from 'bun:sqlite';
import { getGiftShopLiveCharacterIds } from '../../master-data/gift-shop-character-source.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import {
	findArchiveRankingPeriod,
	getArchiveCheerRewards,
} from '../active-master-database/archive-ranking-master.ts';
import { createProfileIconPartsInfo } from './profile-icon-parts-response.ts';

type ArchiveRankingState = Pick<
	ServerState,
	'archiveGiftPoints' | 'registeredUsers' | 'userProfileDesigns'
>;

export function createArchiveRankingResponse(
	database: Database,
	state: ArchiveRankingState,
	requestUser: RegisteredUserState,
	targetPeriod: 'current' | 'previous',
	memberId: number,
	now: string,
) {
	const period = findArchiveRankingPeriod(
		database,
		memberId,
		targetPeriod,
		now,
	);
	if (!period) {
		return {
			status: 0,
			ranking_start_time: null,
			ranking_end_time: null,
			my_rank_status: 'not_participated',
			my_rank: 0,
			cheer_point: 0,
			cheer_rewards: [] satisfies [],
			cheer_rankings: [] satisfies [],
		};
	}
	const pointsByPlayer = calculateCheerPointsByPlayer(
		database,
		state,
		period.characterId,
	);
	const rankings = [...pointsByPlayer]
		.filter(([, cheerPoint]) => cheerPoint > 0)
		.sort(
			([leftPlayerId, leftPoint], [rightPlayerId, rightPoint]) =>
				rightPoint - leftPoint || leftPlayerId.localeCompare(rightPlayerId),
		)
		.map(([playerId, cheerPoint], index) => {
			const user = findRegisteredUser(state, playerId);
			return {
				rank: index + 1,
				player_id: playerId,
				player_name: user.playerName,
				icon_parts_info: createProfileIconPartsInfo(state, playerId),
				cheer_point: cheerPoint,
				is_mute_player: false,
			};
		});
	const myRanking = rankings.find(
		(ranking) => ranking.player_id === requestUser.playerId,
	);
	return {
		status: 0,
		ranking_start_time: period.startTime,
		ranking_end_time: period.endTime,
		my_rank_status: myRanking ? 'ranked' : 'not_participated',
		my_rank: myRanking?.rank ?? 0,
		cheer_point: pointsByPlayer.get(requestUser.playerId) ?? 0,
		cheer_rewards: getArchiveCheerRewards(database, period.id),
		cheer_rankings: rankings,
	};
}

function calculateCheerPointsByPlayer(
	database: Database,
	state: ArchiveRankingState,
	characterId: number,
): ReadonlyMap<string, number> {
	const points = new Map<string, number>();
	for (const giftPoint of state.archiveGiftPoints) {
		const characterIds = getGiftShopLiveCharacterIds(
			database,
			giftPoint.liveId,
			'withlive',
		);
		if (!characterIds.has(characterId)) continue;
		points.set(
			giftPoint.playerId,
			(points.get(giftPoint.playerId) ?? 0) + giftPoint.totalUserGiftPoint,
		);
	}
	return points;
}

function findRegisteredUser(
	state: ArchiveRankingState,
	playerId: string,
): RegisteredUserState {
	const user = state.registeredUsers.find(
		(candidate) => candidate.playerId === playerId,
	);
	if (!user) throw new Error(`archive ranking user not found: ${playerId}`);
	return user;
}
