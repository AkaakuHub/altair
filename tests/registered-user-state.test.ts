import { describe, expect, test } from 'bun:test';
import type { RegisteredUserState } from '../src/server-state-schema.ts';
import {
	findRegisteredUser,
	saveRegisteredUser,
} from '../src/state/registered-user-state.ts';

const baseUser: RegisteredUserState = {
	playerId: 'player',
	deviceSpecificId: 'device',
	sessionToken: 'session',
	playerName: 'before',
	birthday: '0001-01-01T00:00:00Z',
	entryTime: '2026-07-11T00:00:00Z',
	lastLoginDate: '2026-07-11T00:00:00Z',
	playerLevel: 1,
};

describe('registered user state', () => {
	test('同じplayer IDのuserを一件だけ置換する', () => {
		const state = { registeredUsers: [baseUser] };
		saveRegisteredUser(state, { ...baseUser, playerName: 'after' });
		expect(state.registeredUsers).toHaveLength(1);
		expect(findRegisteredUser(state, 'player')?.playerName).toBe('after');
	});
});
