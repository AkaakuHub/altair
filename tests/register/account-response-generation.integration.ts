import { describe, expect, test } from 'bun:test';
import { mockPlayerNames } from '../mock-player-names.ts';
import type { ProfileInfo, UserLoginResponse } from '../response-types.ts';
import { createTestApp, postJson, registerNewUser } from '../test-app.ts';

describe('account response generation', () => {
	test('loginとhomeを登録user stateから生成する', async () => {
		const app = createTestApp();
		const newUserLoginResponse = await postJson(app, '/v1/user/login', {
			player_id: '',
			device_specific_id: '',
			version: 1,
		});
		const newUserLogin =
			(await newUserLoginResponse.json()) as UserLoginResponse;
		expect(newUserLogin.item_store_product_id_list).toHaveLength(160);
		expect(newUserLogin.item_store_product_id_list[0]).toBe(
			'com.oddno.lovelive.item_store_1001',
		);
		expect(newUserLogin.item_store_product_id_list.at(-1)).toBe(
			'com.oddno.lovelive.item_store_1166',
		);

		const registeredUser = await registerNewUser(app, mockPlayerNames[1]);
		const homeResponse = await postJson(app, '/v1/home/get_home');
		const home = (await homeResponse.json()) as {
			beginner_mission_status: number;
			highlighted_badge_info: {
				is_not_displayed_adv_new_part: boolean;
				is_not_received_common_mission_reward: boolean;
				is_not_watched_adv_from_current_season: boolean;
			};
			profile_info: ProfileInfo;
		};
		expect(home.beginner_mission_status).toBe(0);
		expect(home.highlighted_badge_info).toMatchObject({
			is_not_displayed_adv_new_part: expect.any(Boolean),
			is_not_received_common_mission_reward: false,
			is_not_watched_adv_from_current_season: expect.any(Boolean),
		});
		expect(Object.keys(home).sort()).toEqual(
			[
				'beginner_mission_status',
				'expired_limited_gacha_ticket_id_confirm_list',
				'finished_simple_tutorial_list',
				'has_daily_ticket',
				'has_grand_prix_playable_count',
				'highlighted_badge_info',
				'is_finish_tutorial',
				'is_first_home',
				'is_login_bonus',
				'is_not_watched_adv_from_current_season',
				'latest_news_id',
				'membership_pending_list',
				'membership_update_confirm_list',
				'plan_list',
				'profile_info',
				'quest_quit_info',
				'standard_quest_areas_id',
				'standard_quest_stages_id',
			].sort(),
		);
		expect(home.profile_info.player_name).toBe(mockPlayerNames[1]);
		expect(home.profile_info.player_id).toBe(registeredUser.player_id);

		await postJson(app, '/v1/tutorial/set_step', { tutorial_id: 50 });
		const existingUserLoginResponse = await postJson(app, '/v1/user/login', {
			player_id: registeredUser.player_id,
			device_specific_id: registeredUser.device_specific_id,
			version: 1,
		});
		const existingUserLogin =
			(await existingUserLoginResponse.json()) as UserLoginResponse;
		expect(existingUserLogin.session_token).not.toBe(
			registeredUser.session_token,
		);
		expect(
			existingUserLogin.tutorials_status_list.find(
				(status) => status.tutorial_id === 50,
			),
		).toEqual({ tutorial_id: 50, is_complete: true });
	});
});
