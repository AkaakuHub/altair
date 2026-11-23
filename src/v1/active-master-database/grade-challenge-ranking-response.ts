import type { Database } from 'bun:sqlite';
import { getGradeChallengeStageIdentityFingerprint } from '../../master-data/grade-progress-identity.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { findUserGradeChallengeStageProgress } from '../../state/user-grade-challenge-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	getGradeChallengeSeasonTotalHighScore,
	hasPlayedGradeChallengeStageOrSeason,
} from './grade-challenge-stage.ts';
import type {
	GradeChallengeGetRankingListRequest,
	GradeChallengeGetRankingListResponse,
	GradeChallengeRanking,
} from './grade-challenge-types.ts';
import { numberField } from './json-utils.ts';
import type { StoredResponse } from './types.ts';

export function getGradeChallengeRankingList(
	database: Database,
	body: unknown,
	user: RegisteredUserState,
	userLive: UserLiveState,
	profileIconPartsInfo: string,
): StoredResponse {
	const request = parseGradeChallengeGetRankingListRequest(body);
	const response: GradeChallengeGetRankingListResponse = {
		rankings: createGradeChallengeRankingList(
			request,
			database,
			user,
			userLive,
			profileIconPartsInfo,
		),
	};
	return {
		body: response,
		statusCode: 200,
	};
}

function parseGradeChallengeGetRankingListRequest(
	body: unknown,
): GradeChallengeGetRankingListRequest {
	return {
		grade_chal_season_id: numberField(body, 'grade_chal_season_id'),
		grade_chal_quest_stages_id:
			numberField(body, 'grade_chal_quest_stages_id') || null,
	};
}

function createGradeChallengeRankingList(
	request: GradeChallengeGetRankingListRequest,
	database: Database,
	user: RegisteredUserState,
	userLive: UserLiveState,
	profileIconPartsInfo: string,
): GradeChallengeRanking[] {
	const stageId = request.grade_chal_quest_stages_id ?? 0;
	if (
		!hasPlayedGradeChallengeStageOrSeason(
			database,
			userLive,
			request.grade_chal_season_id,
			stageId,
		)
	) {
		return [];
	}
	const stageProgress =
		stageId > 0
			? findStageProgress(
					database,
					userLive,
					request.grade_chal_season_id,
					stageId,
				)
			: null;
	return [
		{
			player_id: user.playerId,
			name: user.playerName,
			user_type: 2,
			profile_icon_parts_info: profileIconPartsInfo,
			rank: 1,
			high_score:
				stageProgress?.highScore ??
				getGradeChallengeSeasonTotalHighScore(
					database,
					userLive,
					request.grade_chal_season_id,
				),
			is_mute_player: false,
			play_report: stageProgress?.playReport ?? '',
		},
	];
}

function findStageProgress(
	database: Database,
	userLive: UserLiveState,
	gradeChalSeasonId: number,
	stageId: number,
) {
	const identityFingerprint = getGradeChallengeStageIdentityFingerprint(
		database,
		stageId,
	);
	return identityFingerprint === undefined
		? undefined
		: findUserGradeChallengeStageProgress(
				userLive,
				gradeChalSeasonId,
				stageId,
				identityFingerprint,
			);
}
