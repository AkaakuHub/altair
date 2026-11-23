import { describe, expect, test } from 'bun:test';
import {
	findUserDreamLiveProgress,
	recordUserDreamLiveResult,
} from '../src/state/user-dream-quest-progress.ts';
import type {
	UserDreamLiveProgressState,
	UserQuestStageProgressState,
} from '../src/state/user-quest-progress-types.ts';
import {
	findUserQuestStageProgress,
	recordUserQuestStageResult,
} from '../src/state/user-standard-quest-progress.ts';

const oldIdentity = {
	domain: 'standard-quest-stage',
	value: '[1001,101,1,5001,2,2001]',
};
const newIdentity = {
	domain: 'standard-quest-stage',
	value: '[1001,101,1,5001,2,2002]',
};

describe('quest progress version projection', () => {
	test('keeps incompatible progress while moving between versions', () => {
		const state = { questStageProgressList: [], dreamLiveProgressList: [] };

		recordUserQuestStageResult(state, 1, 1001, 2001, 100, {
			sourceMasterReleaseId: 'old',
			identityFingerprint: oldIdentity,
		});
		recordUserQuestStageResult(state, 1, 1001, 2002, 200, {
			sourceMasterReleaseId: 'new',
			identityFingerprint: newIdentity,
		});

		expect(state.questStageProgressList).toHaveLength(2);
		expect(
			findUserQuestStageProgress(state, 1, 1001, oldIdentity).highScore,
		).toBe(100);
		expect(
			findUserQuestStageProgress(state, 1, 1001, newIdentity).highScore,
		).toBe(200);
	});

	test('keeps legacy progress visible and binds it on the next write', () => {
		const state: {
			questStageProgressList: UserQuestStageProgressState[];
			dreamLiveProgressList: UserDreamLiveProgressState[];
		} = {
			questStageProgressList: [
				{
					questLiveType: 1,
					stageId: 1001,
					highScore: 100,
					playCount: 1,
				},
			],
			dreamLiveProgressList: [],
		};

		expect(
			findUserQuestStageProgress(state, 1, 1001, newIdentity).highScore,
		).toBe(100);
		recordUserQuestStageResult(state, 1, 1001, 2002, 200, {
			sourceMasterReleaseId: 'new',
			identityFingerprint: newIdentity,
		});
		expect(state.questStageProgressList).toHaveLength(1);
		expect(state.questStageProgressList[0]?.identityFingerprint).toEqual(
			newIdentity,
		);
	});

	test('prefers an exact version match over an unbound legacy entry', () => {
		const state = {
			questStageProgressList: [
				{
					questLiveType: 1,
					stageId: 1001,
					highScore: 100,
					playCount: 1,
				},
				{
					questLiveType: 1,
					stageId: 1001,
					highScore: 200,
					playCount: 1,
					sourceMasterReleaseId: 'new',
					identityFingerprint: newIdentity,
				},
			],
			dreamLiveProgressList: [],
		};

		expect(
			findUserQuestStageProgress(state, 1, 1001, newIdentity).highScore,
		).toBe(200);
	});

	test('keeps dream progress for incompatible stage definitions separately', () => {
		const state = { questStageProgressList: [], dreamLiveProgressList: [] };
		const oldDream = { ...oldIdentity, domain: 'dream-quest-stage' };
		const newDream = { ...newIdentity, domain: 'dream-quest-stage' };

		recordUserDreamLiveResult(state, 1001, {
			sourceMasterReleaseId: 'old',
			identityFingerprint: oldDream,
		});
		recordUserDreamLiveResult(state, 1001, {
			sourceMasterReleaseId: 'new',
			identityFingerprint: newDream,
		});

		expect(state.dreamLiveProgressList).toHaveLength(2);
		expect(findUserDreamLiveProgress(state, 1001, oldDream).clearTimes).toBe(1);
		expect(findUserDreamLiveProgress(state, 1001, newDream).clearTimes).toBe(1);
	});
});
