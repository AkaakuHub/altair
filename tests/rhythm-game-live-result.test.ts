import { describe, expect, test } from 'bun:test';
import { calculateRhythmGameFinish } from '../src/v1/active-master-database/rhythm-game-live-result.ts';

describe('rhythm game live result', () => {
	test('keeps prior records immutable and calculates broken combos', () => {
		const difficultyScores = [
			{
				difficulty: 2,
				best_combo: 25,
				combo_achievement_status: 0,
				clear_lamp: 0,
				technical_score: 100,
			},
		];
		const result = calculateRhythmGameFinish({
			scoreBefore: {
				highScore: 400000,
				highScoreAchievementStatus: 0,
				musicMasteryExperience: 10,
				clearCount: 2,
				totalScoreAccumulated: 700000,
				difficultyScores,
			},
			totalsBefore: {
				clearCount: 4,
				scoreAccumulated: 900000,
				highScoreTotal: 600000,
			},
			difficulty: 2,
			score: 500000,
			technicalScore: 90,
			judgementResults: [2, 2, 1, ...Array.from({ length: 26 }, () => 2)],
			earnedMusicMasteryExperience: 7,
		});

		expect(result).toMatchObject({
			highScoreAfter: 500000,
			highScoreStatusAfter: 1,
			maxComboBefore: 25,
			maxComboAfter: 26,
			comboStatusAfter: 1,
			technicalScoreAfter: 100,
			musicMasteryExperienceAfter: 17,
			totalsAfter: {
				clearCount: 5,
				scoreAccumulated: 1400000,
				highScoreTotal: 700000,
			},
		});
		expect(difficultyScores[0]).toEqual({
			difficulty: 2,
			best_combo: 25,
			combo_achievement_status: 0,
			clear_lamp: 0,
			technical_score: 100,
		});
	});

	test('creates a difficulty result when it has not been played', () => {
		const result = calculateRhythmGameFinish({
			scoreBefore: {
				highScore: 0,
				highScoreAchievementStatus: 0,
				musicMasteryExperience: 0,
				clearCount: 0,
				totalScoreAccumulated: 0,
				difficultyScores: [],
			},
			totalsBefore: { clearCount: 0, scoreAccumulated: 0, highScoreTotal: 0 },
			difficulty: 4,
			score: 0,
			technicalScore: 12,
			judgementResults: [],
			earnedMusicMasteryExperience: 0,
		});

		expect(result.difficultyScores).toEqual([
			{
				difficulty: 4,
				best_combo: 0,
				combo_achievement_status: 0,
				clear_lamp: 1,
				technical_score: 12,
			},
		]);
	});
});
