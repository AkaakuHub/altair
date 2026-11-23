import { describe, expect, test } from 'bun:test';
import type { UserLiveState } from '../src/state/user-live-state.ts';
import { projectHomeStandardQuestSelection } from '../src/v1/route-support/home-standard-quest-selection.ts';

function createUserLive(
	questStageProgressList: UserLiveState['questStageProgressList'],
): UserLiveState {
	return {
		playerId: 'player',
		currentQuestLive: null,
		currentRhythmGame: null,
		currentRhythmGameGrandPrix: null,
		rhythmMusicScores: [],
		rhythmGameClassMissionReceivedOrders: [],
		rhythmGameDecks: [],
		rhythmGameGrandPrixes: [],
		learningMusicMasteries: [],
		questStageProgressList,
		dreamLiveProgressList: [],
		currentGradeQuest: null,
		gradeQuestProgressList: [],
		gradeChallengeProgressList: [],
		gradeChallengeSeasonProgressList: [],
		grandPrixes: [],
	};
}

describe('home standard quest selection', () => {
	test('returns the latest completed standard quest in the current master', () => {
		const userLive = createUserLive([
			{ questLiveType: 1, stageId: 103030101, highScore: 1, playCount: 1 },
			{ questLiveType: 5, stageId: 905010101, highScore: 1, playCount: 1 },
			{ questLiveType: 1, stageId: 103040101, highScore: 1, playCount: 1 },
			{ questLiveType: 1, stageId: 103030102, highScore: 1, playCount: 1 },
		]);

		expect(
			projectHomeStandardQuestSelection(userLive, {
				findAreaId: (stageId) => Math.floor(stageId / 100),
				isCurrentStage: (progress) => progress.stageId !== 103040101,
			}),
		).toEqual({
			standardQuestAreaId: 1030301,
			standardQuestStageId: 103030102,
		});
	});

	test('returns protocol empty ids before a standard quest is completed', () => {
		const userLive = createUserLive([
			{ questLiveType: 1, stageId: 103030101, highScore: 0, playCount: 0 },
		]);

		expect(
			projectHomeStandardQuestSelection(userLive, {
				findAreaId: () => 1030301,
				isCurrentStage: () => true,
			}),
		).toEqual({ standardQuestAreaId: 0, standardQuestStageId: 0 });
	});
});
