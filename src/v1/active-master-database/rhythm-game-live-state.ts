import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	findUserRhythmMusicScore,
	saveUserRhythmMusicScore,
} from '../../state/user-rhythm-music-score-progress.ts';
import type {
	RhythmGameFinishCalculation,
	RhythmGameScoreBefore,
	RhythmGameTotals,
} from './rhythm-game-live-result.ts';

export function getRhythmGameScoreBefore(
	database: Database,
	userLive: UserLiveState,
	musicId: number,
): RhythmGameScoreBefore {
	const identityFingerprint = getMusicIdentityFingerprint(database, musicId);
	if (identityFingerprint === undefined) {
		throw new Error(`music master not found: ${musicId}`);
	}
	const score = findUserRhythmMusicScore(
		userLive,
		musicId,
		identityFingerprint,
	);
	return {
		highScore: score.highScore,
		highScoreAchievementStatus: score.highScoreAchievementStatus,
		musicMasteryExperience: score.musicMasteryExperience,
		clearCount: score.clearCount,
		totalScoreAccumulated: score.totalScoreAccumulated,
		difficultyScores: score.difficultyScores.map((difficultyScore) => ({
			...difficultyScore,
		})),
	};
}

export function getRhythmGameTotals(
	database: Database,
	userLive: UserLiveState,
): RhythmGameTotals {
	const visibleScores = projectCompatibleMusicProgresses(
		userLive.rhythmMusicScores,
		getMusicIdentityFingerprints(database),
	);
	return {
		clearCount: visibleScores.reduce((sum, score) => sum + score.clearCount, 0),
		scoreAccumulated: visibleScores.reduce(
			(sum, score) => sum + score.totalScoreAccumulated,
			0,
		),
		highScoreTotal: visibleScores.reduce(
			(sum, score) => sum + score.highScore,
			0,
		),
	};
}

export function applyRhythmGameFinish(
	userLive: UserLiveState,
	database: Database,
	masterReleaseId: string,
	input: {
		musicId: number;
		score: number;
		musicMasteryLevel: number;
		scoreBefore: RhythmGameScoreBefore;
		finish: RhythmGameFinishCalculation;
	},
): void {
	saveUserRhythmMusicScore(
		userLive,
		{
			musicId: input.musicId,
			highScore: input.finish.highScoreAfter,
			highScoreAchievementStatus: input.finish.highScoreStatusAfter,
			clearCount: input.scoreBefore.clearCount + 1,
			totalScoreAccumulated:
				input.scoreBefore.totalScoreAccumulated + input.score,
			musicMasteryLevel: input.musicMasteryLevel,
			musicMasteryExperience: input.finish.musicMasteryExperienceAfter,
			difficultyScores: input.finish.difficultyScores,
		},
		requireMusicProvenance(database, masterReleaseId, input.musicId),
	);
}

import type { Database } from 'bun:sqlite';
import { projectCompatibleMusicProgresses } from '../../application/music-progress-projection.ts';
import {
	getMusicIdentityFingerprint,
	getMusicIdentityFingerprints,
} from '../../master-data/entity-identity-fingerprints.ts';
import { requireMusicProvenance } from '../../master-data/music-identity.ts';
