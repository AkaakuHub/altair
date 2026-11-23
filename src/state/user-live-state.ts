import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import type {
	UserCurrentRhythmGameGrandPrixState,
	UserRhythmGameGrandPrixState,
} from './rhythm-game-grand-prix-types.ts';
import type { UserCurrentQuestLiveState } from './user-current-quest-live-state.ts';
import type {
	UserGradeChallengeSeasonProgressState,
	UserGradeChallengeStageProgressState,
} from './user-grade-challenge-state.ts';
import type {
	UserGradeQuestProgressState,
	UserGradeQuestState,
} from './user-grade-quest-state.ts';
import type { UserGrandPrixState } from './user-grand-prix-state.ts';
import type { UserLearningMusicMasteryState } from './user-learning-music-state.ts';
import type {
	UserDreamLiveProgressState,
	UserQuestStageProgressState,
} from './user-quest-progress-types.ts';
import type {
	UserCurrentRhythmGameState,
	UserRhythmGameClassMissionReceivedOrderState,
	UserRhythmGameDeckState,
	UserRhythmMusicScoreState,
} from './user-rhythm-game-types.ts';

export type UserLiveState = {
	playerId: string;
	currentQuestLive: UserCurrentQuestLiveState | null;
	currentRhythmGame: UserCurrentRhythmGameState | null;
	currentRhythmGameGrandPrix: UserCurrentRhythmGameGrandPrixState | null;
	rhythmMusicScores: UserRhythmMusicScoreState[];
	rhythmGameClassMissionReceivedOrders: UserRhythmGameClassMissionReceivedOrderState[];
	rhythmGameDecks: UserRhythmGameDeckState[];
	rhythmGameGrandPrixes: UserRhythmGameGrandPrixState[];
	learningMusicMasteries: UserLearningMusicMasteryState[];
	questStageProgressList: UserQuestStageProgressState[];
	dreamLiveProgressList: UserDreamLiveProgressState[];
	currentGradeQuest: UserGradeQuestState | null;
	gradeQuestProgressList: UserGradeQuestProgressState[];
	gradeChallengeProgressList: UserGradeChallengeStageProgressState[];
	gradeChallengeSeasonProgressList: UserGradeChallengeSeasonProgressState[];
	grandPrixes: UserGrandPrixState[];
};

export function ensureUserLiveState(
	state: Pick<ServerState, 'userLives'>,
	playerId: string,
): EnsureStateResult<UserLiveState> {
	const existing = state.userLives.find((live) => live.playerId === playerId);
	if (existing) {
		return { value: existing, created: false };
	}
	const live = {
		playerId,
		currentQuestLive: null,
		currentRhythmGame: null,
		currentRhythmGameGrandPrix: null,
		rhythmMusicScores: [],
		rhythmGameClassMissionReceivedOrders: [],
		rhythmGameDecks: [],
		rhythmGameGrandPrixes: [],
		learningMusicMasteries: [],
		questStageProgressList: [],
		dreamLiveProgressList: [],
		currentGradeQuest: null,
		gradeQuestProgressList: [],
		gradeChallengeProgressList: [],
		gradeChallengeSeasonProgressList: [],
		grandPrixes: [],
	};
	state.userLives = [...state.userLives, live];
	return { value: live, created: true };
}
