import type { Database } from 'bun:sqlite';
import { getGrandPrixRankingMasterFromDatabase } from '../../master-data/grand-prix-ranking-master.ts';
import type {
	GrandPrixRuntimeState,
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import type { CircleState } from '../../state/circle-types.ts';
import {
	findGrandPrixRankingState,
	getGrandPrixCircleRanking,
	getGrandPrixPersonalRanking,
} from '../../state/grand-prix-ranking-aggregate.ts';
import type { UserGrandPrixState } from '../../state/user-grand-prix-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { createProfileIconPartsInfo } from '../responses/profile-icon-parts-response.ts';
import {
	collectGrandPrixHistoryTargets,
	findGrandPrixStagePlayReport,
	isCircleGrandPrixRankingType,
} from './grand-prix-ranking-state-selection.ts';
import { findGrandPrixStageMusicId } from './grand-prix-result-master-query.ts';
import {
	getGrandPrixRewardList,
	hasGrandPrixMaster,
} from './grand-prix-top-ranking-query.ts';
import {
	mapGrandPrixCircleRankings,
	mapGrandPrixPersonalRankings,
	mapGrandPrixRankingListResponse,
} from './grand-prix-top-ranking-response-mapper.ts';
import { numberField } from './json-utils.ts';

type GrandPrixRankingSource = Pick<
	ServerState,
	'grandPrixRankings' | 'registeredUsers' | 'userProfileDesigns'
>;

type GrandPrixProfileSource = Pick<ServerState, 'userProfileDesigns'>;

export function getGrandPrixTopInfo(
	database: Database,
	runtime: GrandPrixRuntimeState,
	circle: CircleState | null,
	user: RegisteredUserState,
	state: Pick<ServerState, 'grandPrixRankings'>,
) {
	const grandPrixId = runtime.activeGrandPrixId;
	if (!hasGrandPrixMaster(database, grandPrixId)) {
		return undefined;
	}
	const grandPrixType = runtime.grandPrixType;
	const rewards = getGrandPrixRewardList(database, grandPrixId, grandPrixType);
	const rankingMaster = getGrandPrixRankingMasterFromDatabase(
		database,
		grandPrixId,
	);
	const ranking = findGrandPrixRankingState(
		state,
		grandPrixId,
		rankingMaster.identityFingerprint,
	);
	const personalRanking = getGrandPrixPersonalRanking(ranking, user.playerId);
	const circleRanking = getGrandPrixCircleRanking(ranking, circle);
	return {
		body: {
			start_date: runtime.startDate,
			end_date: runtime.endDate,
			grand_prix_type: grandPrixType,
			status: runtime.status,
			search_guild_key: circle?.searchGuildKey ?? '',
			guild_name: circle?.guildName ?? '',
			guild_total_point: circleRanking?.point ?? 0,
			guild_ranking: circleRanking?.rank ?? 0,
			within_guild_ranking:
				circleRanking?.memberRankings.find(
					(memberRanking) => memberRanking.playerId === user.playerId,
				)?.rank ?? 0,
			personal_total_point: personalRanking?.point ?? 0,
			personal_ranking: personalRanking?.rank ?? 0,
			get_points: [] satisfies [],
			personal_rewards: grandPrixType === 2 ? [] : rewards,
			circle_rewards: grandPrixType === 2 ? rewards : [],
		},
		statusCode: 200,
	};
}

export function getGrandPrixRankingList(
	database: Database,
	body: unknown,
	runtime: GrandPrixRuntimeState,
	circle: CircleState | null,
	user: RegisteredUserState,
	state: GrandPrixRankingSource,
) {
	const rankingType = numberField(body, 'ranking_type');
	const isCircleRanking = isCircleGrandPrixRankingType(rankingType);
	const rankingMaster = getGrandPrixRankingMasterFromDatabase(
		database,
		runtime.activeGrandPrixId,
	);
	const ranking = findGrandPrixRankingState(
		state,
		runtime.activeGrandPrixId,
		rankingMaster.identityFingerprint,
	);
	const pointRankings = isCircleRanking
		? mapGrandPrixCircleRankings(ranking, circle)
		: mapGrandPrixPersonalRankings(ranking, state);
	const myRank = isCircleRanking
		? (pointRankings[0]?.rank ?? 0)
		: (pointRankings.find((ranking) => ranking.id === user.playerId)?.rank ??
			0);
	return mapGrandPrixRankingListResponse(runtime.status, myRank, pointRankings);
}

export function getGrandPrixHistory(
	database: Database,
	grandPrix: UserGrandPrixState,
	user: RegisteredUserState,
	circle: CircleState | null,
	registeredUsers: RegisteredUserState[],
	userLives: UserLiveState[],
	profileSource: GrandPrixProfileSource,
) {
	const histories = collectGrandPrixHistoryTargets(
		grandPrix,
		user,
		circle,
		registeredUsers,
		userLives,
	)
		.filter((progress) => progress.stage.highScore > 0)
		.sort((left, right) => right.stage.stageId - left.stage.stageId)
		.map((progress) => ({
			player_id: progress.user.playerId,
			name: progress.user.playerName,
			user_type: 2,
			profile_icon_parts_info: createProfileIconPartsInfo(
				profileSource,
				progress.user.playerId,
			),
			point: progress.stage.dailyBestScore,
			play_time: progress.user.lastLoginDate,
			music_id: findGrandPrixStageMusicId(database, progress.stage.stageId),
			stage_id: progress.stage.stageId,
			play_report: findGrandPrixStagePlayReport(progress.user, userLives),
		}));
	return {
		body: { get_point_histories: histories },
		statusCode: 200,
	};
}
