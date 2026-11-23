import { describe, expect, test } from 'bun:test';
import { ensureUserStepUpBeginnerMissionState } from '../src/state/step-up-beginner-mission-state.ts';

describe('step-up beginner mission state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userStepUpBeginnerMissions: [] };

		const first = ensureUserStepUpBeginnerMissionState(state, 'player-a', []);
		const second = ensureUserStepUpBeginnerMissionState(state, 'player-a', []);

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userStepUpBeginnerMissions).toHaveLength(1);
	});
});
