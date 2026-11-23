import type { Database } from 'bun:sqlite';
import { projectCompatibleMusicProgresses } from '../../application/music-progress-projection.ts';
import { getMusicIdentityFingerprints } from '../../master-data/entity-identity-fingerprints.ts';
import { getRhythmGameMusicMasteryLevel } from '../../master-data/rhythm-game-rewards.ts';
import { calculateRhythmGameStarTotal } from '../../state/mission-star-progress.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import type { UserCurrentRhythmGameState } from '../../state/user-rhythm-game-types.ts';
import { isJsonRecord } from '../route-support/request-fields.ts';
import { numberField, numberValue } from './json-utils.ts';
import { calculateRhythmGameFinish } from './rhythm-game-live-result.ts';
import {
	applyRhythmGameFinish,
	getRhythmGameScoreBefore,
	getRhythmGameTotals,
} from './rhythm-game-live-state.ts';

type RhythmGameRewardResponse = {
	reward_type: number;
	reward_item_id: number;
	reward_num: number;
};

export function setRhythmGameStart(
	body: unknown,
	userLive: UserLiveState,
	masterReleaseId: string,
) {
	userLive.currentRhythmGame = {
		masterReleaseId,
		musicId: numberField(body, 'music_id'),
		difficulty: numberField(body, 'music_score_difficulty') || 1,
		consumeStaminaMagnification: numberField(
			body,
			'consume_stamina_magnification',
		),
	};
	return { body: null, statusCode: 200 };
}

export function setRhythmGameFinish(
	database: Database,
	masterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
	nextResetTime: string,
	dropRewards: RhythmGameRewardResponse[],
	earnedMusicMasteryExperience: number,
	appliedCampaignTypes: number[],
) {
	const result = recordRhythmGameFinishResult(
		database,
		masterReleaseId,
		body,
		userLive,
		userLive.currentRhythmGame,
		earnedMusicMasteryExperience,
	);
	if (result === undefined) {
		return undefined;
	}
	return {
		body: {
			music_mastery_level_result: result.musicMasteryLevelResult,
			drop_reward_list: dropRewards,
			music_score_mission_result: result.musicScoreMissionResult,
			clear_status: result.clearStatus,
			class_mission_progress_list: result.classMissionProgressList,
			auto_play_ticket_info: {
				num: 10,
				max: 10,
				next_reset_time: nextResetTime,
			},
			rhythm_game_star_total_count: result.rhythmGameStarTotalCount,
			applied_campaign_types: appliedCampaignTypes,
		},
		statusCode: 200,
	};
}

export function recordRhythmGameFinishResult(
	database: Database,
	masterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
	currentRhythmGame: UserCurrentRhythmGameState | null,
	earnedMusicMasteryExperience: number,
) {
	if (
		!isJsonRecord(body) ||
		currentRhythmGame === null ||
		currentRhythmGame.consumeStaminaMagnification === undefined
	) {
		return undefined;
	}
	const score = numberValue(body.score);
	const technicalScore = numberValue(body.technical_score);
	const musicId = currentRhythmGame.musicId;
	const difficulty = currentRhythmGame.difficulty;
	const before = getRhythmGameScoreBefore(database, userLive, musicId);
	const totalBefore = getRhythmGameTotals(database, userLive);
	const finish = calculateRhythmGameFinish({
		scoreBefore: before,
		totalsBefore: totalBefore,
		difficulty,
		score,
		technicalScore,
		judgementResults: readRhythmGameNotes(body.notes_result_list),
		earnedMusicMasteryExperience,
	});
	applyRhythmGameFinish(userLive, database, masterReleaseId, {
		musicId,
		musicMasteryLevel: getRhythmGameMusicMasteryLevel(
			database,
			finish.musicMasteryExperienceAfter,
		),
		score,
		scoreBefore: before,
		finish,
	});
	return {
		musicMasteryLevelResult: {
			music_id: musicId,
			music_mastery_exp_before: before.musicMasteryExperience,
			music_mastery_exp_after: finish.musicMasteryExperienceAfter,
			own_status: 2,
		},
		musicScoreMissionResult: {
			high_score_before: before.highScore,
			high_score_after: finish.highScoreAfter,
			high_score_achievement_status_before: before.highScoreAchievementStatus,
			high_score_achievement_status_after: finish.highScoreStatusAfter,
			max_combo_before: finish.maxComboBefore,
			max_combo_after: finish.maxComboAfter,
			combo_achievement_status_before: finish.comboStatusBefore,
			combo_achievement_status_after: finish.comboStatusAfter,
			technical_score_before: finish.technicalScoreBefore,
			technical_score_after: finish.technicalScoreAfter,
			reward_list: [] satisfies [],
		},
		clearStatus: before.clearCount === 0 ? 1 : 0,
		classMissionProgressList: [
			{
				condition_type: 1,
				progress_before: totalBefore.clearCount,
				progress_after: finish.totalsAfter.clearCount,
			},
			{
				condition_type: 2,
				progress_before: totalBefore.scoreAccumulated,
				progress_after: finish.totalsAfter.scoreAccumulated,
			},
			{
				condition_type: 3,
				progress_before: totalBefore.highScoreTotal,
				progress_after: finish.totalsAfter.highScoreTotal,
			},
		],
		rhythmGameStarTotalCount: calculateRhythmGameStarTotal({
			...userLive,
			rhythmMusicScores: projectCompatibleMusicProgresses(
				userLive.rhythmMusicScores,
				getMusicIdentityFingerprints(database),
			),
		}),
	};
}

function readRhythmGameNotes(value: unknown): number[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.filter(isJsonRecord)
		.map((note) => numberValue(note.judgement_result));
}
