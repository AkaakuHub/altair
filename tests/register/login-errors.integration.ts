import { describe, expect, test } from 'bun:test';
import { createTestApp, postJson } from '../test-app.ts';

describe('login error responses', () => {
	test('rejects login for an unregistered player id', async () => {
		const app = createTestApp();

		const response = await postJson(app, '/v1/user/login', {
			player_id: 'NOUSER001',
			device_specific_id: '00000000-0000-0000-0000-000000000000',
			version: 1,
		});

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error_code: '00300_101709',
			message: 'ユーザーデータがありません。',
			title: 'エラー',
		});
	});

	test('rejects home without a request user', async () => {
		const app = createTestApp();

		const response = await postJson(app, '/v1/home/get_home', {});

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error_code: '00200_000001',
			message: '他の端末でログインしたため、ログアウトされました。',
			title: 'ログアウト',
		});
	});
});
