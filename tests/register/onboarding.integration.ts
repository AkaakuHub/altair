import { describe, expect, test } from 'bun:test';
import { mockPlayerNames } from '../mock-player-names.ts';
import type {
	LoginBonusResponse,
	ProfileInfo,
	UserLoginResponse,
} from '../response-types.ts';
import { createTestApp, postJson, registerNewUser } from '../test-app.ts';

describe('new user onboarding flow', () => {
	test('serves login, registration, login bonus, home, and tutorial responses', async () => {
		const app = createTestApp();

		const loginResponse = await postJson(app, '/v1/user/login', {
			player_id: '',
			device_specific_id: '',
			version: 1,
		});
		expect(loginResponse.status).toBe(200);
		const loginBody = (await loginResponse.json()) as UserLoginResponse;
		expect(loginBody.is_term_update).toBe(true);
		expect(loginBody.is_tutorial).toBe(true);
		expect(loginBody.session_token).toBe('');
		expect(loginBody.push_device_token).toBe('');
		expect(Array.isArray(loginBody.item_store_product_id_list)).toBe(true);

		const registerBody = await registerNewUser(app);
		expect(registerBody.player_id).toMatch(/^[0-9A-Z]{9}$/);
		expect(registerBody.device_specific_id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
		expect(registerBody.session_token).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);

		const loginBonusResponse = await postJson(app, '/v1/home/get_login_bonus');
		expect(loginBonusResponse.status).toBe(200);
		const loginBonusBody =
			(await loginBonusResponse.json()) as LoginBonusResponse;
		expect(Array.isArray(loginBonusBody.event_login_bonus_list)).toBe(true);
		const eventLoginBonusList = loginBonusBody.event_login_bonus_list;
		const loginBonusList = loginBonusBody.login_bonus_list;
		expect(eventLoginBonusList.map((bonus) => bonus.login_bonus_id)).toEqual([
			201001, 201064,
		]);
		expect(loginBonusList.map((bonus) => bonus.login_bonus_id)).toEqual([
			101002,
		]);
		expect(
			eventLoginBonusList
				.flatMap((bonus) => bonus.datas)
				.filter((data) => data.is_now_get)
				.map((data) => data.count),
		).toEqual([1, 1]);

		const homeResponse = await postJson(app, '/v1/home/get_home');
		expect(homeResponse.status).toBe(200);
		const homeBody = (await homeResponse.json()) as {
			profile_info: ProfileInfo;
		};
		const profileInfo = homeBody.profile_info;
		expect(profileInfo.player_id).toBe(registerBody.player_id);
		expect(profileInfo.player_name).toBe(mockPlayerNames[0]);

		const tutorialResponse = await postJson(app, '/v1/tutorial/set_step', {
			tutorial_id: 30,
		});
		expect(tutorialResponse.status).toBe(200);
		expect(await tutorialResponse.json()).toEqual({ result: true });
		await postJson(app, '/v1/tutorial/set_step', { tutorial_id: 40 });
		await postJson(app, '/v1/tutorial/set_step', { tutorial_id: 50 });

		const tutorialLoginResponse = await postJson(app, '/v1/user/login', {
			player_id: registerBody.player_id,
			device_specific_id: registerBody.device_specific_id,
			version: 1,
		});
		expect(tutorialLoginResponse.status).toBe(200);
		const tutorialLoginBody =
			(await tutorialLoginResponse.json()) as UserLoginResponse;
		const tutorialStatusList = tutorialLoginBody.tutorials_status_list;
		expect(
			tutorialStatusList
				.filter((tutorial) => tutorial.is_complete)
				.map((tutorial) => tutorial.tutorial_id),
		).toEqual([30, 40, 50]);
	});
});
