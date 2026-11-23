import { isArrayOf, isRecord } from './json-state-utils.ts';
import { isUserCurrentRhythmGameGrandPrixState } from './rhythm-game-grand-prix-current-session.ts';
import { isUserRhythmGameGrandPrixState } from './rhythm-game-grand-prix-validator.ts';
import { isUserCurrentQuestLiveState } from './user-current-quest-live-state.ts';
import {
	isUserGradeChallengeSeasonProgressState,
	isUserGradeChallengeStageProgressState,
} from './user-grade-challenge-state.ts';
import {
	isUserGradeQuestProgressState,
	isUserGradeQuestState,
} from './user-grade-quest-state.ts';
import { isUserGrandPrixState } from './user-grand-prix-state.ts';
import { isUserLearningMusicMasteryState } from './user-learning-music-state.ts';
import type { UserLiveState } from './user-live-state.ts';
import {
	isUserDreamLiveProgressState,
	isUserQuestStageProgressState,
} from './user-quest-progress-validator.ts';
import {
	isUserCurrentRhythmGameState,
	isUserRhythmGameClassMissionReceivedOrderState,
	isUserRhythmGameDeckState,
	isUserRhythmMusicScoreState,
} from './user-rhythm-game-validator.ts';

export function isUserLiveState(value: unknown): value is UserLiveState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		(value.currentQuestLive === null ||
			isUserCurrentQuestLiveState(value.currentQuestLive)) &&
		(value.currentRhythmGame === null ||
			isUserCurrentRhythmGameState(value.currentRhythmGame)) &&
		(value.currentRhythmGameGrandPrix === undefined ||
			value.currentRhythmGameGrandPrix === null ||
			isUserCurrentRhythmGameGrandPrixState(
				value.currentRhythmGameGrandPrix,
			)) &&
		isArrayOf(value.rhythmMusicScores, isUserRhythmMusicScoreState) &&
		(value.rhythmGameClassMissionReceivedOrders === undefined ||
			isArrayOf(
				value.rhythmGameClassMissionReceivedOrders,
				isUserRhythmGameClassMissionReceivedOrderState,
			)) &&
		isArrayOf(value.rhythmGameDecks, isUserRhythmGameDeckState) &&
		(value.rhythmGameGrandPrixes === undefined ||
			isArrayOf(value.rhythmGameGrandPrixes, isUserRhythmGameGrandPrixState)) &&
		isArrayOf(value.learningMusicMasteries, isUserLearningMusicMasteryState) &&
		isArrayOf(value.questStageProgressList, isUserQuestStageProgressState) &&
		isArrayOf(value.dreamLiveProgressList, isUserDreamLiveProgressState) &&
		(value.currentGradeQuest === null ||
			isUserGradeQuestState(value.currentGradeQuest)) &&
		isArrayOf(value.gradeQuestProgressList, isUserGradeQuestProgressState) &&
		(value.gradeChallengeProgressList === undefined ||
			isArrayOf(
				value.gradeChallengeProgressList,
				isUserGradeChallengeStageProgressState,
			)) &&
		(value.gradeChallengeSeasonProgressList === undefined ||
			isArrayOf(
				value.gradeChallengeSeasonProgressList,
				isUserGradeChallengeSeasonProgressState,
			)) &&
		isArrayOf(value.grandPrixes, isUserGrandPrixState)
	);
}
