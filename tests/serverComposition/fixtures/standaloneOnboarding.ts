import type { Hono } from 'hono';
import { z } from 'zod';

const cardSchema = z.object({
	user_card_data_list: z.array(z.object({ card_datas_id: z.number() })),
});
const itemSchema = z.object({
	item_category_list: z.array(
		z.object({
			user_item_list: z.array(
				z.object({ item_id: z.number(), item_num: z.number() }),
			),
		}),
	),
});

export async function verifyStandaloneOnboarding(
	app: Hono,
	restore: () => Hono,
) {
	const registered = z
		.object({
			player_id: z.string().min(1),
			session_token: z.string().min(1),
		})
		.parse(
			await request(app, '/v1/register/set_new_user', {
				name: '分離確認',
				platform_type: 1,
			}),
		);
	const token = registered.session_token;
	const cards = cardSchema.parse(
		await request(app, '/v1/user/card/get_list', {}, token),
	);
	const items = itemSchema.parse(
		await request(app, '/v1/user/items/get_list', {}, token),
	);
	const restored = restore();
	const restoredCards = cardSchema.parse(
		await request(restored, '/v1/user/card/get_list', {}, token),
	);
	const restoredItems = itemSchema.parse(
		await request(restored, '/v1/user/items/get_list', {}, token),
	);
	const home = z
		.object({ profile_info: z.object({ player_name: z.string() }) })
		.parse(await request(restored, '/v1/home/get_home', {}, token));
	return {
		cardIds: cards.user_card_data_list.map((card) => card.card_datas_id),
		items: items.item_category_list.flatMap(
			(category) => category.user_item_list,
		),
		restoredCards: restoredCards.user_card_data_list,
		restoredItems: restoredItems.item_category_list.flatMap(
			(category) => category.user_item_list,
		),
		playerName: home.profile_info.player_name,
	};
}

async function request(
	app: Hono,
	path: string,
	body: object,
	token?: string,
): Promise<unknown> {
	const headers = new Headers({ 'content-type': 'application/json' });
	if (token !== undefined) headers.set('authorization', `Bearer ${token}`);
	const response = await app.request(path, {
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	});
	if (response.status !== 200)
		throw new Error(`${path} failed: ${response.status}`);
	return response.json();
}
