import { describe, expect, test } from 'bun:test';
import { ensureUserSession } from '../src/state/user-session-state.ts';

describe('user session state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userSessions: [] };

		const first = ensureUserSession(state, 'player-a');
		const second = ensureUserSession(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
	});
});
