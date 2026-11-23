import { expect, test } from 'bun:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../../src/config.ts';
import { createApp } from '../../src/server.ts';
import { createNoopServerStateStore } from '../../src/server-state-store-port.ts';
import { config } from '../test-app.ts';

test('ゲーム本体の起動では管理・編集APIを登録しない', async () => {
	const app = createApp({
		...config,
		stateStore: createNoopServerStateStore(),
	});
	const health = await app.request('/health');
	expect(health.status).toBe(200);
	expect(await health.json()).toMatchObject({
		ok: true,
		service: 'altair',
		role: 'api',
	});
	for (const path of [
		'/admin',
		'/admin/ui/',
		'/admin/state.json',
		'/admin/api/unregistered',
	]) {
		expect((await app.request(path)).status).toBe(404);
	}
	expect(
		app.routes.some((route) => route.path === '/v1/register/set_new_user'),
	).toBe(true);
	expect(app.routes.some((route) => route.path.startsWith('/admin'))).toBe(
		false,
	);
});

test('ゲーム本体は未定義の環境変数を読み込まない', () => {
	const value = loadConfig({
		HOST: 'localhost',
		PORT: '1',
		DATA_ROOT: join(tmpdir(), 'game-configuration-test'),
		UNUSED_SERVICE: 'unused-service',
		UNUSED_HOST: 'private-gpu',
		UNUSED_FLAG: '1',
	});
	expect(value).not.toHaveProperty('unusedFlag');
	expect(value).not.toHaveProperty('unusedHost');
	expect(value).not.toHaveProperty('unusedService');
});
