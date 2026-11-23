import type { JsonRecord } from './types.ts';

export type RhythmGameScoreBefore = {
	highScore: number;
	highScoreAchievementStatus: number;
	musicMasteryExperience: number;
	clearCount: number;
	totalScoreAccumulated: number;
	difficultyScores: JsonRecord[];
};

export type RhythmGameTotals = {
	clearCount: number;
	scoreAccumulated: number;
	highScoreTotal: number;
};

export type RhythmGameFinishCalculation = {
	highScoreAfter: number;
	highScoreStatusAfter: number;
	maxComboBefore: number;
	maxComboAfter: number;
	comboStatusBefore: number;
	comboStatusAfter: number;
	technicalScoreBefore: number;
	technicalScoreAfter: number;
	musicMasteryExperienceAfter: number;
	difficultyScores: JsonRecord[];
	totalsAfter: RhythmGameTotals;
};

export function calculateRhythmGameFinish(input: {
	scoreBefore: RhythmGameScoreBefore;
	totalsBefore: RhythmGameTotals;
	difficulty: number;
	score: number;
	technicalScore: number;
	judgementResults: number[];
	earnedMusicMasteryExperience: number;
}): RhythmGameFinishCalculation {
	const difficultyScores = input.scoreBefore.difficultyScores.map((score) => ({
		...score,
	}));
	let difficultyEntry = difficultyScores.find(
		(value) => numericValue(value.difficulty) === input.difficulty,
	);
	if (!difficultyEntry) {
		difficultyEntry = {
			difficulty: input.difficulty,
			best_combo: 0,
			combo_achievement_status: 0,
			clear_lamp: 0,
			technical_score: 0,
		};
		difficultyScores.push(difficultyEntry);
	}
	const maxComboBefore = numericValue(difficultyEntry.best_combo);
	const comboStatusBefore = numericValue(
		difficultyEntry.combo_achievement_status,
	);
	const technicalScoreBefore = numericValue(difficultyEntry.technical_score);
	const highScoreAfter = Math.max(input.scoreBefore.highScore, input.score);
	const maxComboAfter = Math.max(
		maxComboBefore,
		calculateMaxCombo(input.judgementResults),
	);
	const technicalScoreAfter = Math.max(
		technicalScoreBefore,
		input.technicalScore,
	);
	const highScoreStatusAfter = highScoreStatus(highScoreAfter);
	const comboStatusAfter = comboStatus(maxComboAfter);
	difficultyEntry.best_combo = maxComboAfter;
	difficultyEntry.combo_achievement_status = comboStatusAfter;
	difficultyEntry.clear_lamp = 1;
	difficultyEntry.technical_score = technicalScoreAfter;
	return {
		highScoreAfter,
		highScoreStatusAfter,
		maxComboBefore,
		maxComboAfter,
		comboStatusBefore,
		comboStatusAfter,
		technicalScoreBefore,
		technicalScoreAfter,
		musicMasteryExperienceAfter:
			input.scoreBefore.musicMasteryExperience +
			input.earnedMusicMasteryExperience,
		difficultyScores,
		totalsAfter: {
			clearCount: input.totalsBefore.clearCount + 1,
			scoreAccumulated: input.totalsBefore.scoreAccumulated + input.score,
			highScoreTotal:
				input.totalsBefore.highScoreTotal -
				input.scoreBefore.highScore +
				highScoreAfter,
		},
	};
}

function numericValue(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function calculateMaxCombo(judgementResults: number[]): number {
	let currentCombo = 0;
	let bestCombo = 0;
	for (const judgementResult of judgementResults) {
		if (judgementResult >= 2) {
			currentCombo += 1;
			bestCombo = Math.max(bestCombo, currentCombo);
		} else {
			currentCombo = 0;
		}
	}
	return bestCombo;
}

function highScoreStatus(score: number): number {
	if (score >= 10000000) return 4;
	if (score >= 3000000) return 3;
	if (score >= 1500000) return 2;
	if (score >= 500000) return 1;
	return 0;
}

function comboStatus(combo: number): number {
	if (combo >= 131) return 4;
	if (combo >= 78) return 3;
	if (combo >= 52) return 2;
	if (combo >= 26) return 1;
	return 0;
}
