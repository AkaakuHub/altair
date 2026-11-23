import { test } from 'bun:test';
import { z } from 'zod';
import { createTestApp } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('登録・ログイン・連携・ホームの実際の入出力がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	const request = createDocumentedRequest(app);
	await request('post', '/v1/user/login');
	await request('post', '/v1/register/get_terms');
	await request('post', '/v1/register/set_approve_terms');
	await request('post', '/v1/register/approve_terms');
	await request('post', '/v1/register/set_user_data', { name: 'Sample User' });
	await request('post', '/v1/tutorial/set_step', { tutorial_id: 30 });
	await request('post', '/v1/user/push/devices', { token: 'sample-token' });
	await request('post', '/v1/user/push/device', { token: 'sample-token' });
	await request('put', '/v1/user/push/device', { token: 'sample-token' });
	await request('post', '/v1/home/get_login_bonus');
	await request('post', '/v1/home/get_home');
	const user = z
		.object({ player_id: z.string(), device_specific_id: z.string() })
		.parse(
			await request('post', '/v1/register/set_new_user', {
				name: 'Sample User',
				platform_type: 1,
			}),
		);
	await request('post', '/v1/user/login', {
		player_id: user.player_id,
		device_specific_id: user.device_specific_id,
	});
	await request('post', '/v1/profile/get_info', { player_id: user.player_id });
	await request('post', '/v1/account/set_connect_data', {
		provider: 1,
		id_token: 'sample-account-token',
		platform_type: 1,
	});
	await request('post', '/v1/account/connect', {
		provider: 1,
		id_token: 'sample-account-token',
		player_id: user.player_id,
		platform_type: 1,
	});
	await request('post', '/v1/account/delete');
});
