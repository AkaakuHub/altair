import { describe, expect, test } from 'bun:test';
import { ensureUserSocialState } from '../src/state/user-social-aggregate.ts';

describe('social state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userSocials: [] };

		const first = ensureUserSocialState(state, 'player-a');
		const second = ensureUserSocialState(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userSocials).toHaveLength(1);
	});
});
