import type { Database } from 'bun:sqlite';
import { getGradeChallengeStageIdentityFingerprint } from '../../master-data/grade-progress-identity.ts';
import { findUserGradeChallengeStageProgress } from '../../state/user-grade-challenge-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	findGradeChallengeStage,
	type GradeChallengeStageRewardRow,
	getGradeChallengeStageRewards,
	getGradeChallengeStages,
} from './grade-challenge-master.ts';
import type { GradeChallengeStageRewardInfo } from './grade-challenge-types.ts';

export function findGradeChallengeStageMusic(
	database: Database,
	stageId: number,
): {
	musicId: number;
	questMusicsType: number;
} {
	const stage = findGradeChallengeStage(database, stageId);
	if (stage === null) {
		return { musicId: 0, questMusicsType: 0 };
	}
	return {
		musicId: stage.quest_musics_detail,
		questMusicsType: stage.quest_musics_type,
	};
}

export function getGradeChallengeStageRewardInfoList(
	database: Database,
	stageId: number,
	highScore: number,
	playCount: number,
): GradeChallengeStageRewardInfo[] {
	return createGradeChallengeStageRewardInfoList(
		getGradeChallengeStageRewards(database, [stageId]).get(stageId) ?? [],
		highScore,
		playCount,
	);
}

export function createGradeChallengeStageRewardInfoList(
	rewards: GradeChallengeStageRewardRow[],
	highScore: number,
	playCount: number,
): GradeChallengeStageRewardInfo[] {
	return rewards.map((reward) => ({
		grade_chal_quest_stages_rewards_id: reward.id,
		is_received: isGradeChallengeStageRewardReceived(
			reward,
			highScore,
			playCount,
		),
	}));
}

export function isGradeChallengeStageRewardReceived(
	reward: GradeChallengeStageRewardRow,
	highScore: number,
	playCount: number,
): boolean {
	if (reward.conditions_type === 1) {
		return playCount > reward.conditions_value;
	}
	if (reward.conditions_type === 2) {
		return highScore >= reward.conditions_value;
	}
	throw new Error(
		`unsupported Grade Challenge stage reward condition type ${reward.conditions_type}`,
	);
}

export function getGradeChallengeSeasonTotalHighScore(
	database: Database,
	userLive: UserLiveState,
	gradeChalSeasonId: number,
): number {
	return userLive.gradeChallengeProgressList
		.filter((progress) => {
			if (progress.gradeChalSeasonId !== gradeChalSeasonId) return false;
			const identityFingerprint = getGradeChallengeStageIdentityFingerprint(
				database,
				progress.stageId,
			);
			return (
				identityFingerprint !== undefined &&
				findUserGradeChallengeStageProgress(
					userLive,
					gradeChalSeasonId,
					progress.stageId,
					identityFingerprint,
				) === progress
			);
		})
		.reduce((total, progress) => total + progress.highScore, 0);
}

export function hasPlayedGradeChallengeStageOrSeason(
	database: Database,
	userLive: UserLiveState,
	gradeChalSeasonId: number,
	stageId: number,
): boolean {
	if (stageId > 0) {
		const identityFingerprint = getGradeChallengeStageIdentityFingerprint(
			database,
			stageId,
		);
		return (
			identityFingerprint !== undefined &&
			findUserGradeChallengeStageProgress(
				userLive,
				gradeChalSeasonId,
				stageId,
				identityFingerprint,
			).playCount > 0
		);
	}
	return getGradeChallengeStages(database, gradeChalSeasonId).some((stage) => {
		const identityFingerprint = getGradeChallengeStageIdentityFingerprint(
			database,
			stage.id,
		);
		return (
			identityFingerprint !== undefined &&
			findUserGradeChallengeStageProgress(
				userLive,
				gradeChalSeasonId,
				stage.id,
				identityFingerprint,
			).playCount > 0
		);
	});
}
