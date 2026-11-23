export type RhythmGameClassMissionConditionType = 1 | 2 | 3;

const conditionTypes = [1, 2, 3] as const;

export function rhythmGameClassMissionConditionTypes(): readonly RhythmGameClassMissionConditionType[] {
	return conditionTypes;
}

export function isRhythmGameClassMissionConditionType(
	value: number,
): value is RhythmGameClassMissionConditionType {
	return value === 1 || value === 2 || value === 3;
}

export function calculateRhythmGameClassMissionProgress(
	scores: readonly {
		clearCount: number;
		totalScoreAccumulated: number;
		highScore: number;
	}[],
	conditionType: RhythmGameClassMissionConditionType,
): number {
	switch (conditionType) {
		case 1:
			return scores.reduce((sum, score) => sum + score.clearCount, 0);
		case 2:
			return scores.reduce(
				(sum, score) => sum + score.totalScoreAccumulated,
				0,
			);
		case 3:
			return scores.reduce((sum, score) => sum + score.highScore, 0);
	}
}
