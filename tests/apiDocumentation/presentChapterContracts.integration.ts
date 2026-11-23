import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('プレゼントの一覧・個別受取・一括受取・履歴がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	await request('post', '/v1/home/get_login_bonus');
	const list = z
		.object({
			items: z.array(
				z
					.object({ d_present_boxes_id: z.string(), live_id: z.string() })
					.passthrough(),
			),
		})
		.parse(await request('post', '/v1/present_box/get_list'));
	for (const item of list.items) {
		expect(item).not.toHaveProperty('rewardProvenance');
		expect(item).not.toHaveProperty('withstationPlaybackReward');
	}
	const present = list.items.find((item) => item.live_id.length === 0);
	if (present === undefined)
		throw new Error('Login bonus fixture has no ordinary reward');
	await request('post', '/v1/present_box/set_item', {
		d_present_boxes_id: present.d_present_boxes_id,
	});
	await request('post', '/v1/present_box/set_item_all');
	await request('post', '/v1/present_box/get_history');
	expect(
		await request('post', '/v1/present_box/get_list', { page: 2 }),
	).toEqual({ page: 2, total_count: 0 });
	expect(
		await request('post', '/v1/present_box/get_history', { page: 2 }),
	).toEqual({ page: 2, total_count: 0 });
});

test('チャプターの概要・カテゴリ・報酬取得がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const home = z
		.object({
			category_list: z.array(z.object({ category_id: z.number() })),
			rank_info: z.object({ current_point: z.number() }),
		})
		.parse(await request('post', '/v1/chapter/home'));
	const category = home.category_list[0];
	if (category === undefined)
		throw new Error('Chapter fixture has no categories');
	await request('post', '/v1/chapter/category_info', {
		category_id: category.category_id,
	});
	await request('post', '/v1/chapter/get_point_rewards');
	await request('post', '/v1/chapter/claim_point_rewards', {
		current_point: home.rank_info.current_point,
	});
});
