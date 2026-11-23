import { describe, expect, test } from 'bun:test';
import { ensureUserTutorialState } from '../src/state/user-tutorial-state.ts';

describe('user tutorial state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userTutorials: [] };

		const first = ensureUserTutorialState(state, 'player-a');
		const second = ensureUserTutorialState(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
	});
});
