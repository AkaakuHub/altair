import { describe, expect, test } from 'bun:test';
import type { UserLiveState } from '../src/state/user-live-state.ts';
import {
	questClearStatus,
	sequentialStageStates,
} from '../src/v1/active-master-database/quest-stage-progression.ts';

function userLiveWithProgress(
	questStageProgressList: UserLiveState['questStageProgressList'],
): UserLiveState {
	return {
		playerId: 'player-a',
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

describe('quest stage progression', () => {
	test('unlocks only the stage immediately following a cleared stage', () => {
		const rows = [{ stage_id: 101 }, { stage_id: 102 }, { stage_id: 103 }];
		const userLive = userLiveWithProgress([
			{
				questLiveType: 1,
				stageId: 101,
				highScore: 100,
				playCount: 1,
			},
		]);

		expect(
			sequentialStageStates(rows, userLive, 1).map(({ row, isLock }) => ({
				stageId: row.stage_id,
				isLock,
			})),
		).toEqual([
			{ stageId: 101, isLock: false },
			{ stageId: 102, isLock: false },
			{ stageId: 103, isLock: true },
		]);
	});

	test('derives clear status without mutating progress', () => {
		const progress = {
			questLiveType: 1,
			stageId: 101,
			highScore: 100,
			playCount: 1,
		};

		expect(questClearStatus(progress)).toBe(3);
		expect(progress.playCount).toBe(1);
	});
});
