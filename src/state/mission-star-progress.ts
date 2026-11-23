import type { UserLiveState } from './user-live-state.ts';

export function calculateStandardQuestStarTotal(
	userLive: UserLiveState,
	isCompatible: (
		progress: UserLiveState['questStageProgressList'][number],
	) => boolean = () => true,
): number {
	return (
		userLive.questStageProgressList.filter(
			(progress) =>
				progress.questLiveType === 1 &&
				progress.playCount > 0 &&
				isCompatible(progress),
		).length * 3
	);
}

export function calculateRhythmGameStarTotal(userLive: UserLiveState): number {
	return userLive.rhythmMusicScores.reduce((sum, score) => {
		return (
			sum +
			score.highScoreAchievementStatus +
			score.difficultyScores.reduce<number>((innerSum, difficultyScore) => {
				return (
					innerSum +
					readNumber(difficultyScore.combo_achievement_status) +
					readNumber(difficultyScore.clear_lamp)
				);
			}, 0)
		);
	}, 0);
}

function readNumber(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
