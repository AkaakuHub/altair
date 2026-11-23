import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import type { RegisteredUserState } from '../src/server-state-schema.ts';
import { createResponseHeaderContextFactory } from '../src/v1/route-support/response-header-context-factory.ts';

describe('createResponseHeaderContextFactory', () => {
	test('request userを解決してmaster DBは必要になるまで開かない', async () => {
		const user = createRegisteredUser('100', 'token-100');
		let masterReleaseResolutionCount = 0;
		const createHeaderContext = createResponseHeaderContextFactory({
			state: { registeredUsers: [user] },
			resolveRequestMasterRelease: () => {
				masterReleaseResolutionCount += 1;
				throw new Error('master DBを参照しないheaderでは解決されない');
			},
			resolveUserStatus: () => {
				throw new Error('status viewを参照しないheaderでは解決されない');
			},
		});
		let resolvedUser: RegisteredUserState | undefined;
		const app = new Hono();
		app.get('/', (c) => {
			resolvedUser = createHeaderContext(c).user;
			return c.body(null, 204);
		});

		await app.request('/', {
			headers: { authorization: 'Bearer token-100' },
		});

		expect(resolvedUser).toBe(user);
		expect(masterReleaseResolutionCount).toBe(0);
	});

	test('routeが指定したuserをrequest userより優先する', async () => {
		const requestUser = createRegisteredUser('100', 'token-100');
		const routeUser = createRegisteredUser('200', 'token-200');
		const createHeaderContext = createResponseHeaderContextFactory({
			state: { registeredUsers: [requestUser, routeUser] },
			resolveRequestMasterRelease: () => {
				throw new Error('master DBを参照しないheaderでは解決されない');
			},
			resolveUserStatus: () => {
				throw new Error('status viewを参照しないheaderでは解決されない');
			},
		});
		let resolvedUser: RegisteredUserState | undefined;
		const app = new Hono();
		app.get('/', (c) => {
			resolvedUser = createHeaderContext(c, { user: routeUser }).user;
			return c.body(null, 204);
		});

		await app.request('/', {
			headers: { authorization: 'Bearer token-100' },
		});

		expect(resolvedUser).toBe(routeUser);
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
