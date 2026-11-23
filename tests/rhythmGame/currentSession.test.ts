import { describe, expect, test } from 'bun:test';
import { retireCurrentRhythmGame } from '../../src/state/rhythm-game/current-session.ts';
import {
	ensureUserLiveState,
	type UserLiveState,
} from '../../src/state/user-live-state.ts';

describe('rhythm game retirement', () => {
	test('中断したユーザーの通常プレイだけを終了し、進捗と別ユーザーを維持する', () => {
		const state: { userLives: UserLiveState[] } = { userLives: [] };
		const first = ensureUserLiveState(state, 'first').value;
		const second = ensureUserLiveState(state, 'second').value;
		for (const live of state.userLives) {
			live.currentRhythmGame = {
				masterReleaseId: 'release',
				musicId: 405101,
				difficulty: 2,
				consumeStaminaMagnification: 3,
			};
			live.rhythmGameClassMissionReceivedOrders = [
				{ conditionType: 1, receivedOrder: 5 },
			];
		}
		const expectedFirst = {
			...structuredClone(first),
			currentRhythmGame: null,
		};
		const expectedSecond = structuredClone(second);

		expect(retireCurrentRhythmGame(state, 'first')).toBe(true);
		expect(first).toEqual(expectedFirst);
		expect(second).toEqual(expectedSecond);
		expect(retireCurrentRhythmGame(state, 'first')).toBe(false);
	});

	test('プレイstateがないユーザーに空stateを新設しない', () => {
		const state: { userLives: UserLiveState[] } = { userLives: [] };
		expect(retireCurrentRhythmGame(state, 'missing')).toBe(false);
		expect(state.userLives).toEqual([]);
	});
});
