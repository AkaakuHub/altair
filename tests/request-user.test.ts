import { describe, expect, test } from 'bun:test';
import type { RegisteredUserState } from '../src/server-state-schema.ts';
import { resolveRequestUser } from '../src/v1/route-support/request-user.ts';

describe('resolveRequestUser', () => {
	test('resolves a bearer token from registered users', () => {
		const user = createRegisteredUser('100', 'token-100');

		expect(
			resolveRequestUser(new Headers({ authorization: 'Bearer token-100' }), {
				registeredUsers: [user],
			}),
		).toBe(user);
	});

	test('keeps first-match behavior for duplicate session tokens', () => {
		const firstUser = createRegisteredUser('100', 'token');
		const secondUser = createRegisteredUser('200', 'token');

		expect(
			resolveRequestUser(new Headers({ authorization: 'Bearer token' }), {
				registeredUsers: [firstUser, secondUser],
			}),
		).toBe(firstUser);
	});
});

function createRegisteredUser(
	playerId: string,
	sessionToken: string,
): RegisteredUserState {
	return {
		playerId,
		sessionToken,
		deviceSpecificId: `device-${playerId}`,
		playerName: `user-${playerId}`,
		birthday: '',
		entryTime: '',
		lastLoginDate: '',
		playerLevel: 1,
	};
}
