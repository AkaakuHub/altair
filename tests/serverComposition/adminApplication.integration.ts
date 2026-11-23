import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createAdminApp } from '../../packages/admin-server/src/server.ts';
import { createNoopServerStateStore } from '../../src/server-state-store-port.ts';
import { mockPlayerNames } from '../mock-player-names.ts';
import { config, registerNewUser } from '../test-app.ts';

const runtimeSwitchLauncher = { launch: () => Promise.resolve() };

test('通常AdminとゲームAPIと追加ルートは同じ保存状態を参照する', async () => {
	const app = createAdminApp(
		{ ...config, stateStore: createNoopServerStateStore() },
		() => ({
			runtimeSwitchLauncher,
			registerAdditionalRoutes: (routes, dependencies) => {
				routes.get('/extension-probe', (context) =>
					context.json({
						playerNames: dependencies.state.registeredUsers.map(
							(user) => user.playerName,
						),
					}),
				);
			},
		}),
	);
	await registerNewUser(app);
	const response = await app.request('/admin/state.json?page=users');
	expect(response.status).toBe(200);
	const body = z
		.object({
			state: z.object({
				registeredUsers: z.array(z.object({ playerName: z.string() })),
			}),
		})
		.parse(await response.json());
	expect(body.state.registeredUsers.map((user) => user.playerName)).toEqual([
		mockPlayerNames[0],
	]);
	const extension = await app.request('/admin/extension-probe');
	expect(extension.status).toBe(200);
	expect(await extension.json()).toEqual({ playerNames: [mockPlayerNames[0]] });
});

test('通常Adminは未登録のルートに404を返す', async () => {
	const app = createAdminApp(
		{ ...config, stateStore: createNoopServerStateStore() },
		() => ({ runtimeSwitchLauncher }),
	);
	expect((await app.request('/admin/state.json?page=users')).status).toBe(200);
	for (const path of [
		'/admin/api/unregistered/quest-live/user-decks',
		'/admin/api/unregistered/live-face-rigs/99999',
		'/admin/api/unregistered/live-face-rigs/0',
		'/admin/extension-probe',
		'/admin/api/unregistered/health',
		'/admin/api/unregistered/projects',
	]) {
		expect((await app.request(path)).status).toBe(404);
	}
});
