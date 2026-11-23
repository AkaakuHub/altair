import type { Database } from 'bun:sqlite';
import {
	getGrandPrixQuestSeriesRows,
	getGrandPrixQuestStageRows,
} from '../../master-data/grand-prix-master-queries.ts';
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
import { getGrandPrixRankingScoreSource } from '../../state/grand-prix-ranking-score.ts';
import { isGrandPrixPlayable } from '../../state/grand-prix-runtime-status.ts';
import type { UserGrandPrixState } from '../../state/user-grand-prix-state.ts';
import {
	grandPrixQuestPlayCount,
	grandPrixQuestSummary,
} from './grand-prix-result-responses.ts';
import { numberField, numberValue } from './json-utils.ts';
import { musicListWithScoreFromDatabase } from './music-list-data.ts';

type GrandPrixStageSelectSource = Pick<
	ServerState,
	'grandPrixRankings' | 'userLives'
>;

export function getGrandPrixStageSelect(
	database: Database,
	grandPrix: UserGrandPrixState,
	runtime: GrandPrixRuntimeState,
	circle: CircleState | null,
	user: RegisteredUserState,
	state: GrandPrixStageSelectSource,
) {
	const series = getGrandPrixQuestSeriesRows(database, grandPrix.grandPrixId);
	const stages = series.map((row) =>
		grandPrixQuestSummary(database, row.id, grandPrix, runtime),
	);
	const dailyTotalPoint = stages.reduce(
		(sum, value) => sum + numberValue(value.daily_point),
		0,
	);
	const bestPoint = stages.reduce(
		(sum, value) => sum + numberValue(value.high_score),
		0,
	);
	const rankingScoreSource = getGrandPrixRankingScoreSource(
		state,
		grandPrix.grandPrixId,
		user.playerId,
		getGrandPrixRankingMasterFromDatabase(database, grandPrix.grandPrixId),
	);
	return {
		body: {
			daily_total_point: dailyTotalPoint,
			best_point: bestPoint,
			stages,
			stage_ranking_info_list: [
				createGrandPrixStageRankingInfo(
					database,
					dailyTotalPoint,
					grandPrix.grandPrixId,
					runtime,
					circle,
					user,
					state,
				),
			],
			predicated_ranking_score_info: {
				ranking_score: rankingScoreSource.point,
				contents_type: rankingScoreSource.contentsType,
			},
		},
		statusCode: 200,
	};
}

function createGrandPrixStageRankingInfo(
	database: Database,
	dailyTotalPoint: number,
	grandPrixId: number,
	runtime: GrandPrixRuntimeState,
	circle: CircleState | null,
	user: RegisteredUserState,
	state: Pick<ServerState, 'grandPrixRankings'>,
): { quest_id: 0; rank_display_type: number; rank: number; point: number } {
	if (dailyTotalPoint <= 0) {
		return { quest_id: 0, rank_display_type: 1, rank: 0, point: 0 };
	}
	const ranking = findGrandPrixRankingState(
		state,
		grandPrixId,
		getGrandPrixRankingMasterFromDatabase(database, grandPrixId)
			.identityFingerprint,
	);
	const userRanking =
		runtime.grandPrixType === 2
			? getGrandPrixCircleRanking(ranking, circle)?.memberRankings.find(
					(memberRanking) => memberRanking.playerId === user.playerId,
				)
			: getGrandPrixPersonalRanking(ranking, user.playerId);
	if (userRanking === undefined) {
		return {
			quest_id: 0,
			rank_display_type: 2,
			rank: 0,
			point: dailyTotalPoint,
		};
	}
	return {
		quest_id: 0,
		rank_display_type: 4,
		rank: userRanking.rank,
		point: userRanking.point,
	};
}

export function getGrandPrixStageList(
	database: Database,
	body: unknown,
	grandPrix: UserGrandPrixState,
	runtime: GrandPrixRuntimeState,
) {
	const questId = numberField(body, 'quest_id');
	const rows = getGrandPrixQuestStageRows(database, questId);
	const questPlayCount = grandPrixQuestPlayCount(database, grandPrix, questId);
	const playable = isGrandPrixPlayable(runtime);
	return {
		body: {
			stage_list: rows.map((row) => ({
				stage_id: row.id,
				clear_status: 3,
				is_lock: !playable,
				playable_count: playable ? runtime.dailyPlayableCount : 0,
				play_count: questPlayCount,
				play_count_bonus_value: 10000,
			})),
		},
		statusCode: 200,
	};
}

export function getGrandPrixStageData(
	database: Database,
	body: unknown,
	grandPrix: UserGrandPrixState,
	runtime: GrandPrixRuntimeState,
) {
	const stageId = numberField(body, 'stage_id');
	const stage = database
		.query(
			'SELECT grand_prix_series_id, name, order_id, quest_musics_type, quest_musics_detail FROM master_grand_prix_quest_stages WHERE id = ?',
		)
		.get(stageId) as {
		grand_prix_series_id: number;
		name: string;
		order_id: number;
		quest_musics_type: number;
		quest_musics_detail: number;
	} | null;
	const questPlayCount =
		stage === null
			? 0
			: grandPrixQuestPlayCount(
					database,
					grandPrix,
					stage.grand_prix_series_id,
				);
	const stageMusic =
		stage === null ? null : grandPrixStageMusic(runtime, stageId, stage);
	return {
		body: {
			stage_name: stage?.name ?? '',
			clear_status: 3,
			stage_reward_list: [] satisfies [],
			playable_count: isGrandPrixPlayable(runtime)
				? runtime.dailyPlayableCount
				: 0,
			play_count: questPlayCount,
			play_count_bonus_value: 10000,
			skip_guarantee_point: 0,
			music_list:
				stageMusic?.questMusicsType === 2 && stageMusic.questMusicsDetail > 0
					? [{ m_musics_id: stageMusic.questMusicsDetail, is_enable: true }]
					: musicListWithScoreFromDatabase(database),
			is_today_playable:
				isGrandPrixPlayable(runtime) && runtime.dailyPlayableCount > 0,
		},
		statusCode: 200,
	};
}

function grandPrixStageMusic(
	runtime: GrandPrixRuntimeState,
	stageId: number,
	stage: { quest_musics_type: number; quest_musics_detail: number },
): { questMusicsType: number; questMusicsDetail: number } {
	const override = grandPrixStageOverride(runtime, stageId);
	if (override !== undefined) {
		return {
			questMusicsType: override.questMusicsType,
			questMusicsDetail: override.questMusicsDetail,
		};
	}
	return {
		questMusicsType: stage.quest_musics_type,
		questMusicsDetail: stage.quest_musics_detail,
	};
}

function grandPrixStageOverride(
	runtime: GrandPrixRuntimeState,
	stageId: number,
): GrandPrixRuntimeState['stageOverrides'][number] | undefined {
	return runtime.stageOverrides.find(
		(override) => override.stageId === stageId,
	);
}
