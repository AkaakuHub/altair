import { describe, expect, test } from 'bun:test';
import { ensureUserProfileDesign } from '../src/state/profile-design-state.ts';

describe('profile design state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userProfileDesigns: [] };

		const first = ensureUserProfileDesign(state, 'player-a');
		const second = ensureUserProfileDesign(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userProfileDesigns).toHaveLength(1);
	});
});
