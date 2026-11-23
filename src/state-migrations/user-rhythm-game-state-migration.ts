import type { UserRhythmGameStateOwner } from '../state/user-rhythm-game-types.ts';

export function migrateUserRhythmMusicScores(
	userLive: UserRhythmGameStateOwner,
): void {
	for (const score of userLive.rhythmMusicScores) {
		score.musicMasteryExperience ??= 0;
		for (const difficultyScore of score.difficultyScores) {
			difficultyScore.technical_score ??= 0;
		}
	}
	userLive.rhythmGameClassMissionReceivedOrders ??= [];
}
