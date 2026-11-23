import { describe, expect, test } from 'bun:test';
import { ensureUserLiveState } from '../src/state/user-live-state.ts';

describe('user live state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userLives: [] };

		const first = ensureUserLiveState(state, 'player-a');
		const second = ensureUserLiveState(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userLives).toHaveLength(1);
	});

	test('creates independent state for each player', () => {
		const state = { userLives: [] };

		const first = ensureUserLiveState(state, 'player-a');
		const second = ensureUserLiveState(state, 'player-b');

		expect(first.value.playerId).toBe('player-a');
		expect(second.value.playerId).toBe('player-b');
		expect(second.created).toBe(true);
		expect(state.userLives).toHaveLength(2);
	});
});
