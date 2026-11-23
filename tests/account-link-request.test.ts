import { describe, expect, test } from 'bun:test';
import {
	readAccountConnectRequest,
	readAccountLinkRequest,
} from '../src/v1/route-support/account-link-request.ts';

describe('account link request', () => {
	test('reads the account link fields without applying route defaults', () => {
		expect(
			readAccountLinkRequest({
				id_token: 'link-token',
				platform_type: 2,
				provider: 1,
			}),
		).toEqual({ idToken: 'link-token', platformType: 2, provider: 1 });
		expect(
			readAccountLinkRequest({ platform_type: '2', provider: '1' }),
		).toEqual({
			idToken: '',
			platformType: undefined,
			provider: undefined,
		});
	});

	test('reads player id for account connection', () => {
		expect(
			readAccountConnectRequest({
				id_token: 'link-token',
				platform_type: 2,
				player_id: 123,
				provider: 1,
			}),
		).toEqual({
			idToken: 'link-token',
			platformType: 2,
			playerId: '123',
			provider: 1,
		});
	});
});
