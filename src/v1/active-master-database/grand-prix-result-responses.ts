import type { Database } from 'bun:sqlite';
import { applyGrandPrixResultProgress } from '../../application/grand-prix-result-progress.ts';
import { getGrandPrixQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
import type { GrandPrixRuntimeState } from '../../server-state-schema.ts';
import { isGrandPrixPlayable } from '../../state/grand-prix-runtime-status.ts';
import type { UserCurrentQuestLiveState } from '../../state/user-current-quest-live-state.ts';
import {
	findGrandPrixStageProgress,
	type UserGrandPrixState,
} from '../../state/user-grand-prix-state.ts';
import { createGrandPrixPointBonusListFromDatabase } from './grand-prix-point-bonus.ts';
import {
	calculateGrandPrixDailyScore,
	playReportCardBonusTargets,
} from './grand-prix-result-calculation.ts';
import {
	findGrandPrixStageMusicId,
	findGrandPrixStageRank,
	getGrandPrixQuestStageIds,
} from './grand-prix-result-master-query.ts';

export function getGrandPrixResult(
	database: Database,
	grandPrix: UserGrandPrixState,
	currentQuestLive: UserCurrentQuestLiveState,
) {
	const stageId = currentQuestLive.stageId;
	const score = currentQuestLive.score;
	const identityFingerprint = getGrandPrixQuestStageIdentityFingerprint(
		database,
		stageId,
	);
	const pointBonusList = grandPrixPointBonusList(
		database,
		grandPrix.grandPrixId,
		currentQuestLive,
	);
	const dailyScore = calculateGrandPrixDailyScore(score, pointBonusList);
	const progressBefore = applyGrandPrixResultProgress({
		grandPrix,
		stageId,
		score,
		dailyScore,
		isRehearsal: currentQuestLive.isRehearsal === true,
		...(identityFingerprint === undefined ? {} : { identityFingerprint }),
		...(currentQuestLive.masterReleaseId === undefined
			? {}
			: { sourceMasterReleaseId: currentQuestLive.masterReleaseId }),
	});
	return {
		body: {
			quest_live_type: 6,
			stage_id: stageId,
			quest_result: true,
			result_love: score,
			best_love: Math.max(score, progressBefore.highScore),
			before_best_love: progressBefore.highScore,
			add_style_point: 0,
			is_challenge_mode: false,
			music_id: currentQuestLive.musicId,
			reward_list: [] satisfies [],
			play_report: currentQuestLive.playReport,
			mastary_level_before: currentQuestLive.isRehearsal === true ? 0 : 1,
			mastary_level_after: currentQuestLive.isRehearsal === true ? 0 : 1,
			mastary_level_experience: 0,
			mastary_level_total_experience_before: 0,
			first_clear_flag: false,
			first_complete_clear_flag: false,
			is_limit_over_style_point: false,
			daily_score: dailyScore,
			before_high_score: progressBefore.dailyBestScore,
			is_rehearsal: currentQuestLive.isRehearsal ?? false,
			is_guarantee: false,
			point_bonus_list: pointBonusList,
		},
		statusCode: 200,
	};
}

function grandPrixPointBonusList(
	database: Database,
	grandPrixId: number,
	currentQuestLive: UserCurrentQuestLiveState,
) {
	return createGrandPrixPointBonusListFromDatabase(
		database,
		grandPrixId,
		playReportCardBonusTargets(currentQuestLive.playReport),
	);
}

export function grandPrixQuestSummary(
	database: Database,
	questId: number,
	grandPrix: UserGrandPrixState,
	runtime: GrandPrixRuntimeState,
) {
	const playable = isGrandPrixPlayable(runtime);
	const stageIds = getGrandPrixQuestStageIds(database, questId);
	const progressList = stageIds.map((stageId) =>
		findGrandPrixStageProgress(grandPrix, stageId),
	);
	const highScore = Math.max(
		0,
		...progressList.map((progress) => progress.highScore),
	);
	const dailyBest = [...progressList]
		.sort((left, right) => right.dailyBestScore - left.dailyBestScore)
		.find((progress) => progress.dailyBestScore > 0);
	const dailyStageId = dailyBest?.stageId ?? 0;
	const dailyRank =
		dailyStageId > 0 ? findGrandPrixStageRank(database, dailyStageId) : 0;
	const highScoreStageId = [...progressList]
		.sort((left, right) => right.highScore - left.highScore)
		.find((progress) => progress.highScore > 0)?.stageId;
	const highScoreRank =
		highScoreStageId === undefined
			? 0
			: findGrandPrixStageRank(database, highScoreStageId);
	return {
		quest_id: questId,
		daily_stage_id: dailyStageId,
		daily_point: dailyBest?.dailyBestScore ?? 0,
		daily_music_id:
			dailyStageId > 0 ? findGrandPrixStageMusicId(database, dailyStageId) : 0,
		daily_rank: dailyRank,
		high_score: highScore,
		high_score_rank: highScoreRank,
		is_lock: !playable,
		playable_count: playable ? runtime.dailyPlayableCount : 0,
		play_count: progressList.reduce(
			(sum, progress) => sum + progress.playCount,
			0,
		),
		play_count_bonus_value: 10000,
	};
}

export function grandPrixQuestPlayCount(
	database: Database,
	grandPrix: UserGrandPrixState,
	questId: number,
): number {
	return getGrandPrixQuestStageIds(database, questId).reduce(
		(sum, stageId) =>
			sum + findGrandPrixStageProgress(grandPrix, stageId).playCount,
		0,
	);
}
