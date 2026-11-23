import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('所持品一覧・詳細とコンテンツの表示履歴がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const list = z
		.object({
			item_category_list: z.array(
				z.object({
					user_item_list: z.array(
						z.object({
							item_id: z.number(),
							item_num: z.number(),
							user_item_id: z.string(),
						}),
					),
				}),
			),
		})
		.parse(await request('post', '/v1/user/items/get_list'));
	const item = list.item_category_list
		.flatMap((category) => category.user_item_list)
		.find((item) => item.item_num > 0);
	if (item === undefined)
		throw new Error('Inventory fixture has no owned item');
	expect(
		await request('post', '/v1/user/item/get_detail', {
			d_item_datas_id: item.user_item_id,
		}),
	).toMatchObject({
		d_item_datas_id: item.user_item_id,
		user_item_id: item.user_item_id,
		item_num: item.item_num,
	});
	expect(
		await request('post', '/v1/user/set_contents_release_effect_history', {
			contents_id: 1,
		}),
	).toEqual({ contents_id: 1, status: 1 });
});

test('スタミナ回復情報と空のアイテム指定の応答がSwagger契約に適合する', async () => {
	const app = createTestApp({
		requestLogEnabled: false,
		currentDate: () => new Date('2026-11-01T00:00:00Z'),
	});
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const schema = z.object({
		user_stamina: z.object({ stamina_now: z.number() }),
	});
	const before = schema.parse(
		await request('post', '/v1/out_quest_live/get_stamina_recovery_info'),
	);
	const after = schema.parse(
		await request('post', '/v1/out_quest_live/recovery_stamina', {
			use_recovery_type: 2,
			use_item_list: [],
		}),
	);
	expect(after.user_stamina.stamina_now).toBe(before.user_stamina.stamina_now);
});
