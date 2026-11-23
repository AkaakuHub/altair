import type { Database } from 'bun:sqlite';
import { projectRhythmGameGrandPrixDeckCards } from '../../application/rhythm-game-grand-prix-deck-projection.ts';
import { getRhythmGameGrandPrixSeriesRows } from '../../master-data/grand-prix-master-queries.ts';
import { getGrandPrixRankingMasterFromDatabase } from '../../master-data/grand-prix-ranking-master.ts';
import { createRhythmGameGrandPrixSeriesIdentityFingerprint } from '../../master-data/rhythm-game-grand-prix-series-identity.ts';
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
import { getGrandPrixRankingScoreSource } from '../../state/grand-prix-ranking-score.ts';
import { isGrandPrixPlayable } from '../../state/grand-prix-runtime-status.ts';
import { findRhythmGameGrandPrixSeriesProgress } from '../../state/rhythm-game-grand-prix-series-progress.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { numberField } from './json-utils.ts';
import { createRhythmGameGrandPrixDeckCardInfoList } from './rhythm-game-grand-prix-response-values.ts';

import type { StoredResponse } from './types.ts';

type RhythmGameGrandPrixTopSource = Pick<
	ServerState,
	'grandPrixRankings' | 'userLives'
>;

export function getRhythmGameGrandPrixTop(
	database: Database,
	body: unknown,
	runtime: GrandPrixRuntimeState,
	circle: CircleState | null,
	user: RegisteredUserState,
	state: RhythmGameGrandPrixTopSource,
	userLive: UserLiveState,
	visibleCardDataIds: ReadonlySet<string>,
): StoredResponse | undefined {
	const requestGrandPrixId = numberField(body, 'grand_prix_id');
	if (requestGrandPrixId <= 0) {
		return undefined;
	}
	const grandPrixId = runtime.activeGrandPrixId;
	const seriesRows = getRhythmGameGrandPrixSeriesRows(database, grandPrixId);
	if (seriesRows.length === 0) {
		return undefined;
	}
	const userGrandPrix = userLive.rhythmGameGrandPrixes.find(
		(grandPrix) => grandPrix.grandPrixId === grandPrixId,
	);
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
	const withinGuildRanking =
		circleRanking?.memberRankings.find(
			(memberRanking) => memberRanking.playerId === user.playerId,
		)?.rank ?? 0;
	const rankingScoreSource = getGrandPrixRankingScoreSource(
		state,
		grandPrixId,
		user.playerId,
		rankingMaster,
	);
	const currentRanking =
		runtime.grandPrixType === 2
			? (circleRanking?.rank ?? 0)
			: (personalRanking?.rank ?? 0);
	const dailyTotalPoint = seriesRows.reduce((total, series) => {
		const identityFingerprint =
			createRhythmGameGrandPrixSeriesIdentityFingerprint(series);
		const progress =
			userGrandPrix === undefined
				? undefined
				: findRhythmGameGrandPrixSeriesProgress(
						userGrandPrix,
						series.id,
						identityFingerprint,
					);
		return total + (progress?.currentDailyPoint ?? 0);
	}, 0);
	return {
		body: {
			series_list: seriesRows.map((series) => {
				const identityFingerprint =
					createRhythmGameGrandPrixSeriesIdentityFingerprint(series);
				const progress =
					userGrandPrix === undefined
						? undefined
						: findRhythmGameGrandPrixSeriesProgress(
								userGrandPrix,
								series.id,
								identityFingerprint,
							);
				return {
					grand_prix_rhythm_game_series_id: series.id,
					deck_card_list: createRhythmGameGrandPrixDeckCardInfoList(
						projectRhythmGameGrandPrixDeckCards(
							progress?.deckCardList ?? [],
							visibleCardDataIds,
						),
					),
					best_score: progress?.highScore ?? 0,
					current_daily_point: progress?.currentDailyPoint ?? 0,
					is_locked: !isGrandPrixPlayable(runtime),
					top_used_list: [],
				};
			}),
			ranking: currentRanking,
			ranking_score: rankingScoreSource.point,
			rank_display_type: rhythmGameGrandPrixRankDisplayType(
				rankingScoreSource.point,
				currentRanking,
			),
			daily_total_grand_prix_point: dailyTotalPoint,
			personal_ranking_info: {
				personal_total_point: personalRanking?.point ?? 0,
				personal_ranking: personalRanking?.rank ?? 0,
			},
			circle_ranking_info: {
				search_guild_key: circle?.searchGuildKey ?? '',
				guild_name: circle?.guildName ?? '',
				guild_total_point: circleRanking?.point ?? 0,
				guild_ranking: circleRanking?.rank ?? 0,
				within_guild_ranking: withinGuildRanking,
			},
			status: rhythmGameGrandPrixStatus(runtime),
			predicated_ranking_score_info: {
				ranking_score: rankingScoreSource.point,
				contents_type: rankingScoreSource.contentsType,
			},
			get_points: [],
		},
		statusCode: 200,
	};
}

export function rhythmGameGrandPrixStatus(
	runtime: Pick<GrandPrixRuntimeState, 'status'>,
): number {
	if (runtime.status >= 2) {
		return 2;
	}
	if (runtime.status === 1) {
		return 1;
	}
	return 4;
}

export function rhythmGameGrandPrixRankDisplayType(
	point: number,
	rank: number,
): number {
	if (point <= 0) {
		return 1;
	}
	return rank > 0 ? 4 : 2;
}
