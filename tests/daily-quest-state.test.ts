import { describe, expect, test } from 'bun:test';
import { ensureUserDailyQuestState } from '../src/state/daily-quest-state.ts';

describe('daily quest state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userDailyQuestStates: [] };

		const first = ensureUserDailyQuestState(state, 'player-a');
		const second = ensureUserDailyQuestState(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userDailyQuestStates).toHaveLength(1);
	});
});
