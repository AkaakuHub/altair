import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../../src/server.ts';
import { createSqliteServerStateStore } from '../../src/sqlite-server-state-store.ts';
import { mockPlayerNames } from '../mock-player-names.ts';
import { authHeaders, config, postJson, registerNewUser } from '../test-app.ts';

describe('registration state persistence', () => {
	test('persists home state created by get_home in SQLite', async () => {
		const tmpRoot = mkdtempSync(join(tmpdir(), 'link-like-state-'));
		try {
			const stateDbPath = join(tmpRoot, 'state.sqlite');
			const app = createApp({
				...config,
				stateDbPath,
				stateStore: createSqliteServerStateStore(stateDbPath),
			});
			const registerBody = await registerNewUser(app, mockPlayerNames[10]);

			const homeResponse = await postJson(
				app,
				'/v1/home/get_home',
				{},
				authHeaders(String(registerBody.session_token)),
			);
			expect(homeResponse.status).toBe(200);

			const db = new Database(stateDbPath, { readonly: true });
			try {
				const profileSettingsRow = db
					.query(
						`select string_value
						from server_state_entries
						where path = ? and value_type = 'string'`,
					)
					.get('userProfileSettings/0/playerId') as {
					string_value: string;
				} | null;
				expect(profileSettingsRow?.string_value).toBe(registerBody.player_id);
				const archiveCollectionRow = db
					.query(
						`select string_value
						from server_state_entries
						where path = ? and value_type = 'string'`,
					)
					.get('userArchiveCollections/0/playerId') as {
					string_value: string;
				} | null;
				expect(archiveCollectionRow?.string_value).toBe(registerBody.player_id);
			} finally {
				db.close();
			}
		} finally {
			rmSync(tmpRoot, { recursive: true, force: true });
		}
	});

	test('persists profile tutorial state in SQLite', async () => {
		const tmpRoot = mkdtempSync(join(tmpdir(), 'link-like-state-'));
		try {
			const stateDbPath = join(tmpRoot, 'state.sqlite');
			const app = createApp({
				...config,
				stateDbPath,
				stateStore: createSqliteServerStateStore(stateDbPath),
			});
			const registerBody = await registerNewUser(app, mockPlayerNames[10]);
			const simpleTutorialResponse = await postJson(
				app,
				'/v1/user/set_simple_tutorial_finish',
				{ contents_id: 501 },
				authHeaders(String(registerBody.session_token)),
			);
			expect(simpleTutorialResponse.status).toBe(200);

			const db = new Database(stateDbPath, { readonly: true });
			try {
				const row = db
					.query(
						`select number_value
						from server_state_entries
						where path = ? and value_type = 'number'`,
					)
					.get('userProfileSettings/0/finishedSimpleTutorialIds/0') as {
					number_value: number;
				} | null;
				expect(row).not.toBeNull();
				expect(row?.number_value).toBe(501);
			} finally {
				db.close();
			}

			const persistedApp = createApp({
				...config,
				stateDbPath,
				stateStore: createSqliteServerStateStore(stateDbPath),
			});
			const loginResponse = await postJson(persistedApp, '/v1/user/login', {
				player_id: registerBody.player_id,
				device_specific_id: registerBody.device_specific_id,
				version: 1,
			});
			expect(loginResponse.status).toBe(200);
			const loginBody = (await loginResponse.json()) as {
				session_token: string;
			};
			const homeResponse = await postJson(
				persistedApp,
				'/v1/home/get_home',
				{},
				authHeaders(loginBody.session_token),
			);
			expect(homeResponse.status).toBe(200);
			const homeBody = (await homeResponse.json()) as {
				finished_simple_tutorial_list: number[];
			};
			expect(homeBody.finished_simple_tutorial_list).toEqual([501]);
		} finally {
			rmSync(tmpRoot, { recursive: true, force: true });
		}
	});

	test('persists selected profile card design after relogin', async () => {
		const tmpRoot = mkdtempSync(join(tmpdir(), 'link-like-state-'));
		try {
			const stateDbPath = join(tmpRoot, 'state.sqlite');
			const app = createApp({
				...config,
				stateDbPath,
				stateStore: createSqliteServerStateStore(stateDbPath),
			});
			const registerBody = await registerNewUser(app, mockPlayerNames[10]);
			const sessionToken = String(registerBody.session_token);
			const cardDesign = await getSecondProfileCardDesign(app, sessionToken);

			const profileCardPartsInfo =
				'{"A":0,"B":[{"A":1,"H":10315010,"I":10315010}]}';
			const setDesignResponse = await postJson(
				app,
				'/v1/profile/set_my_design_card',
				{
					d_profile_my_designs_id: cardDesign.d_profile_my_designs_id,
					profile_card_parts_info: profileCardPartsInfo,
					my_design_name: 'カスタム2',
				},
				authHeaders(sessionToken),
			);
			expect(setDesignResponse.status).toBe(200);
			const setSelectionResponse = await postJson(
				app,
				'/v1/profile/set_profile_card',
				{ d_profile_my_designs_id: cardDesign.d_profile_my_designs_id },
				authHeaders(sessionToken),
			);
			expect(setSelectionResponse.status).toBe(200);

			const persistedApp = createApp({
				...config,
				stateDbPath,
				stateStore: createSqliteServerStateStore(stateDbPath),
			});
			const loginResponse = await postJson(persistedApp, '/v1/user/login', {
				player_id: registerBody.player_id,
				device_specific_id: registerBody.device_specific_id,
				version: 1,
			});
			expect(loginResponse.status).toBe(200);
			const loginBody = (await loginResponse.json()) as {
				session_token: string;
			};

			const customSettingResponse = await postJson(
				persistedApp,
				'/v1/home/get_custom_setting',
				{},
				authHeaders(loginBody.session_token),
			);
			expect(customSettingResponse.status).toBe(200);
			const customSettingBody = (await customSettingResponse.json()) as {
				profile_info: { profile_card_parts_info: string };
			};
			expect(customSettingBody.profile_info.profile_card_parts_info).toBe(
				profileCardPartsInfo,
			);

			const homeResponse = await postJson(
				persistedApp,
				'/v1/home/get_home',
				{},
				authHeaders(loginBody.session_token),
			);
			expect(homeResponse.status).toBe(200);
			const homeBody = (await homeResponse.json()) as {
				profile_info: { profile_card_parts_info: string };
			};
			expect(homeBody.profile_info.profile_card_parts_info).toBe(
				profileCardPartsInfo,
			);
		} finally {
			rmSync(tmpRoot, { recursive: true, force: true });
		}
	});
});

type ProfileDesignEntry = {
	d_profile_my_designs_id: string;
	my_design_parts_info: string;
	my_design_name: string;
	my_design_type: 1;
	is_setting: boolean;
};

async function getSecondProfileCardDesign(
	app: ReturnType<typeof createApp>,
	sessionToken: string,
): Promise<ProfileDesignEntry> {
	const response = await postJson(
		app,
		'/v1/profile/get_my_design_card_list',
		{},
		authHeaders(sessionToken),
	);
	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		my_design_list: ProfileDesignEntry[];
	};
	const cardDesign = body.my_design_list[1];
	if (cardDesign === undefined) {
		throw new Error('profile card design list must have a second entry');
	}
	return cardDesign;
}
