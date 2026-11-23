import type { Database } from 'bun:sqlite';
import {
	getGradeChallengeSeasonIdentityFingerprint,
	getGradeChallengeStageIdentityFingerprint,
} from '../../master-data/grade-progress-identity.ts';
import {
	addUserGradeChallengeSeasonGradePoint,
	findUserGradeChallengeSeasonProgress,
	findUserGradeChallengeStageProgress,
	recordUserGradeChallengeStageResult,
} from '../../state/user-grade-challenge-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { getStringField } from '../route-support/request-fields.ts';
import {
	findGradeChallengeStage,
	getGradeNumForGradePoint,
} from './grade-challenge-master.ts';
import {
	getGradeChallengeSeasonTotalHighScore,
	getGradeChallengeStageRewardInfoList,
} from './grade-challenge-stage.ts';
import type {
	GradeChallengeGetResultRequest,
	GradeChallengeGetResultResponse,
} from './grade-challenge-types.ts';
import type { StoredResponse } from './types.ts';

export function getGradeChallengeResult(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
): StoredResponse | undefined {
	const request = parseGradeChallengeGetResultRequest(body);
	const currentQuestLive = userLive.currentQuestLive;
	if (
		currentQuestLive === null ||
		currentQuestLive.questLiveId !== request.quest_live_id ||
		currentQuestLive.questLiveType !== 10
	) {
		return undefined;
	}
	const stage = findGradeChallengeStage(database, currentQuestLive.stageId);
	if (stage === null) {
		return undefined;
	}
	const stageIdentityFingerprint = getGradeChallengeStageIdentityFingerprint(
		database,
		currentQuestLive.stageId,
	);
	const seasonIdentityFingerprint = getGradeChallengeSeasonIdentityFingerprint(
		database,
		stage.grade_chal_season_id,
	);
	if (
		currentQuestLive.masterReleaseId === undefined ||
		stageIdentityFingerprint === undefined ||
		seasonIdentityFingerprint === undefined
	) {
		return undefined;
	}
	const progressBefore = findUserGradeChallengeStageProgress(
		userLive,
		stage.grade_chal_season_id,
		currentQuestLive.stageId,
		stageIdentityFingerprint,
	);
	const seasonProgressBefore = findUserGradeChallengeSeasonProgress(
		userLive,
		stage.grade_chal_season_id,
		seasonIdentityFingerprint,
	);
	const addHighScore = Math.max(
		0,
		currentQuestLive.score - progressBefore.highScore,
	);
	const addGradePoint = gradeChallengePointFromLove(addHighScore);
	const gradeUpBefore = getGradeNumForGradePoint(
		database,
		seasonProgressBefore.seasonGradePoint,
	);
	const progressAfter = recordUserGradeChallengeStageResult(
		userLive,
		stage.grade_chal_season_id,
		currentQuestLive.stageId,
		currentQuestLive.musicId,
		currentQuestLive.score,
		currentQuestLive.playReport,
		{
			sourceMasterReleaseId: currentQuestLive.masterReleaseId,
			identityFingerprint: stageIdentityFingerprint,
		},
	);
	const seasonProgressAfter = addUserGradeChallengeSeasonGradePoint(
		userLive,
		stage.grade_chal_season_id,
		addGradePoint,
		{
			sourceMasterReleaseId: currentQuestLive.masterReleaseId,
			identityFingerprint: seasonIdentityFingerprint,
		},
	);
	const gradeUpAfter = getGradeNumForGradePoint(
		database,
		seasonProgressAfter.seasonGradePoint,
	);
	userLive.currentQuestLive = null;
	const totalHighScore = getGradeChallengeSeasonTotalHighScore(
		database,
		userLive,
		stage.grade_chal_season_id,
	);
	const response: GradeChallengeGetResultResponse = {
		quest_live_type: currentQuestLive.questLiveType,
		quest_stage_id: currentQuestLive.stageId,
		quest_result: true,
		result_love: currentQuestLive.score,
		add_high_score: addHighScore,
		total_high_score: totalHighScore,
		add_grade_point: addGradePoint,
		season_grade_point: seasonProgressAfter.seasonGradePoint,
		reward_list: getGradeChallengeStageRewardInfoList(
			database,
			currentQuestLive.stageId,
			progressAfter.highScore,
			progressAfter.playCount,
		),
		play_report: currentQuestLive.playReport,
		grade_up_data: {
			before_grade_num: gradeUpBefore,
			after_grade_num: gradeUpAfter,
		},
	};
	return {
		body: response,
		statusCode: 200,
	};
}

export function gradeChallengePointFromLove(love: number): number {
	return Math.floor(love / 1_000_000_000);
}

function parseGradeChallengeGetResultRequest(
	body: unknown,
): GradeChallengeGetResultRequest {
	return {
		quest_live_id: getStringField(body, 'quest_live_id'),
	};
}
