import { describe, expect, test } from 'bun:test';
import { ensureUserStatus } from '../src/state/user-status-state.ts';
import type { UserStatusState } from '../src/state/user-status-types.ts';

describe('user status state', () => {
	test('creates a status for a player without one', () => {
		const state = { userStatuses: [] as UserStatusState[] };

		const result = ensureUserStatus(state, 'player-1');

		expect(result.created).toBe(true);
		expect(result.value.playerId).toBe('player-1');
		expect(state.userStatuses).toEqual([result.value]);
	});

	test('returns the existing status without creating another one', () => {
		const existing = createUserStatus('player-1');
		const state = { userStatuses: [existing] };

		const result = ensureUserStatus(state, 'player-1');

		expect(result).toEqual({ value: existing, created: false });
		expect(result.value).toBe(existing);
		expect(state.userStatuses).toEqual([existing]);
	});
});

function createUserStatus(playerId: string): UserStatusState {
	return {
		playerId,
		jewelFree: 0,
		jewelPaidApple: 0,
		jewelPaidGoogle: 0,
		jewelStaminaRecoveryCount: 0,
		jewelStaminaRecoveryGameDate: null,
		staminaNow: 100,
		staminaMax: 100,
		staminaRecoveryTime: '9999-12-31T23:59:59.999Z',
		seasonFanLevelSeasonId: 0,
		seasonFanLevelPointStock: 0,
		seasonFanLevelPointStockLimit: 0,
		memberFanLevels: [],
		seasonFanLevels: [],
		fanLevelEarnProgresses: [],
	};
}
