import type { AdminVisibleServerState } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';

export function projectUserLivesForAdmin(
	state: Pick<ServerState, 'userLives'>,
): AdminVisibleServerState['userLives'] {
	return state.userLives.map((live) => ({
		...live,
		rhythmMusicScores: live.rhythmMusicScores.map((score) => ({
			musicId: score.musicId,
			highScore: score.highScore,
			highScoreAchievementStatus: score.highScoreAchievementStatus,
			clearCount: score.clearCount,
			totalScoreAccumulated: score.totalScoreAccumulated,
			musicMasteryLevel: score.musicMasteryLevel,
			musicMasteryExperience: score.musicMasteryExperience,
			difficultyScores: score.difficultyScores,
		})),
		learningMusicMasteries: live.learningMusicMasteries.map((mastery) => ({
			musicId: mastery.musicId,
			musicExpLevel: mastery.musicExpLevel,
			earnedMusicExp: mastery.earnedMusicExp,
			isMastery: mastery.isMastery,
		})),
		gradeQuestProgressList: live.gradeQuestProgressList.map((progress) => ({
			seriesId: progress.seriesId,
			clearStatus: progress.clearStatus,
			bonusCleared: progress.bonusCleared,
		})),
		gradeChallengeProgressList: live.gradeChallengeProgressList.map(
			(progress) => ({
				gradeChalSeasonId: progress.gradeChalSeasonId,
				stageId: progress.stageId,
				musicId: progress.musicId,
				highScore: progress.highScore,
				playCount: progress.playCount,
				playReport: progress.playReport,
			}),
		),
		gradeChallengeSeasonProgressList: live.gradeChallengeSeasonProgressList.map(
			(progress) => ({
				gradeChalSeasonId: progress.gradeChalSeasonId,
				seasonGradePoint: progress.seasonGradePoint,
			}),
		),
		grandPrixes: live.grandPrixes.map((grandPrix) => ({
			grandPrixId: grandPrix.grandPrixId,
			stageProgressList: grandPrix.stageProgressList.map((progress) => ({
				stageId: progress.stageId,
				highScore: progress.highScore,
				dailyBestScore: progress.dailyBestScore,
				playCount: progress.playCount,
			})),
		})),
	}));
}
