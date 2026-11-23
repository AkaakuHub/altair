import type { Database } from 'bun:sqlite';
import {
	getGradeChallengeSeasonIdentityFingerprint,
	getGradeChallengeStageIdentityFingerprint,
} from '../../master-data/grade-progress-identity.ts';
import {
	findUserGradeChallengeSeasonProgress,
	findUserGradeChallengeStageProgress,
} from '../../state/user-grade-challenge-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	getGradeChallengeStageRewards,
	getGradeChallengeStages,
} from './grade-challenge-master.ts';
import { createGradeChallengeStageRewardInfoList } from './grade-challenge-stage.ts';
import type {
	GradeChallengeGetQuestListRequest,
	GradeChallengeGetQuestListResponse,
	GradeChallengeStageInfo,
} from './grade-challenge-types.ts';
import { numberField } from './json-utils.ts';
import { musicListForQuestFromDatabase } from './music-list-data.ts';
import type { StoredResponse } from './types.ts';

export function getGradeChallengeQuestList(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
): StoredResponse {
	const request = parseGradeChallengeGetQuestListRequest(body);
	const seasonIdentityFingerprint = getGradeChallengeSeasonIdentityFingerprint(
		database,
		request.grade_chal_season_id,
	);
	const response: GradeChallengeGetQuestListResponse = {
		stage_list: createGradeChallengeStageList(
			database,
			request.grade_chal_season_id,
			userLive,
		),
		received_total_score_rewards_id: 0,
		season_grade_point:
			seasonIdentityFingerprint === undefined
				? 0
				: findUserGradeChallengeSeasonProgress(
						userLive,
						request.grade_chal_season_id,
						seasonIdentityFingerprint,
					).seasonGradePoint,
		is_update_grade_live: false,
	};
	return {
		body: response,
		statusCode: 200,
	};
}

function parseGradeChallengeGetQuestListRequest(
	body: unknown,
): GradeChallengeGetQuestListRequest {
	return {
		grade_chal_season_id: numberField(body, 'grade_chal_season_id'),
	};
}

function createGradeChallengeStageList(
	database: Database,
	gradeChallengeSeasonId: number,
	userLive: UserLiveState,
): GradeChallengeStageInfo[] {
	const stages = getGradeChallengeStages(database, gradeChallengeSeasonId);
	const rewards = getGradeChallengeStageRewards(
		database,
		stages.map((stage) => stage.id),
	);
	return stages.map((stage) => {
		const identityFingerprint = getGradeChallengeStageIdentityFingerprint(
			database,
			stage.id,
		);
		if (identityFingerprint === undefined) {
			throw new Error(`Grade Challenge stage ${stage.id} identity is required`);
		}
		const progress = findUserGradeChallengeStageProgress(
			userLive,
			stage.grade_chal_season_id,
			stage.id,
			identityFingerprint,
		);
		return {
			quest_stage_id: stage.id,
			high_score: progress.highScore,
			reward_list: createGradeChallengeStageRewardInfoList(
				rewards.get(stage.id) ?? [],
				progress.highScore,
				progress.playCount,
			),
			music_list: musicListForQuestFromDatabase(
				database,
				stage.quest_musics_type,
				stage.quest_musics_detail,
			),
		};
	});
}
