import { expect, test } from 'bun:test';
import { createTestApp, postJson, registerNewUser } from '../test-app.ts';

test('School Idol Show deckの名称を保存する', async () => {
	const app = createTestApp();
	await registerNewUser(app);

	const createDeckResponse = await postJson(
		app,
		'/v1/rhythm_game_deck/modify_deck_list',
		{
			modify_deck_list: [
				{
					deck_no: 1,
					name: '変更前',
					deck_card_list: [],
				},
			],
		},
	);
	expect(createDeckResponse.status).toBe(200);

	const renameResponse = await postJson(
		app,
		'/v1/rhythm_game_deck/set_deck_name',
		{ deck_no: 1, name: '変更後' },
	);
	expect(renameResponse.status).toBe(200);
	expect(await renameResponse.json()).toBeNull();

	const homeResponse = await postJson(app, '/v1/rhythm_game/home');
	expect(homeResponse.status).toBe(200);
	const home = (await homeResponse.json()) as {
		rhythm_game_deck_list: Array<{
			deck_no: number;
			name: string;
			deck_card_list: unknown[];
		}>;
	};
	expect(home.rhythm_game_deck_list).toHaveLength(1);
	expect(home.rhythm_game_deck_list[0]).toMatchObject({
		deck_no: 1,
		name: '変更後',
		deck_card_list: [],
	});
});
