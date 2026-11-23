import { describe, expect, test } from 'bun:test';
import { registerAccountContentUser } from './account-content/helpers.ts';
import { createTestApp, postJson } from './test-app.ts';

describe('active master official response contract', () => {
	test('単一active databaseから記録済みcardとitem response契約を維持する', async () => {
		const app = createTestApp();
		await registerAccountContentUser(app);

		const cards = await postJson(app, '/v1/user/card/get_list', {
			search_conditions: '{}',
		});
		expect(cards.status).toBe(200);
		const cardBody = (await cards.json()) as {
			user_card_data_list: Array<{
				card_datas_id: number;
				character_bonus: { music_mastery_bonus_list: unknown[] };
			}>;
		};
		expect(cardBody.user_card_data_list).toHaveLength(13);
		expect(cardBody.user_card_data_list[0]?.character_bonus).toHaveProperty(
			'music_mastery_bonus_list',
		);

		const items = await postJson(app, '/v1/user/items/get_list');
		expect(items.status).toBe(200);
		const itemBody = (await items.json()) as {
			item_category_list: Array<{
				item_category: number;
				user_item_list: Array<{ item_id: number; item_num: number }>;
			}>;
		};
		expect(itemBody.item_category_list.length).toBeGreaterThan(0);
		expect(
			itemBody.item_category_list
				.flatMap((category) => category.user_item_list)
				.some((item) => item.item_id === 2003073),
		).toBe(true);
	});
});
