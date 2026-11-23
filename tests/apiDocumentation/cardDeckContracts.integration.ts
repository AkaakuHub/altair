import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

const cardsSchema = z.object({
	user_card_data_list: z.array(
		z.object({ d_card_datas_id: z.string(), card_datas_id: z.number() }),
	),
});
const deckSchema = z.object({
	d_deck_datas_id: z.string(),
	deck_no: z.number(),
	deck_name: z.string(),
	generations_id: z.number(),
	deck_cards_list: z.array(
		z.object({ d_deck_cards_id: z.string(), slot_no: z.number() }),
	),
});

test('カードの一覧・詳細とデッキの更新がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const rawCards = await request('post', '/v1/user/card/get_list');
	const wireCards = z
		.object({ user_card_data_list: z.array(z.record(z.string(), z.unknown())) })
		.parse(rawCards);
	for (const entry of wireCards.user_card_data_list) {
		expect(entry).not.toHaveProperty('source_master_release_id');
		expect(entry).not.toHaveProperty('identity_fingerprint');
	}
	const cards = cardsSchema.parse(rawCards);
	const card = cards.user_card_data_list[0];
	if (card === undefined) throw new Error('Card fixture has no owned cards');
	expect(
		await request('post', '/v1/user/card/get_detail', {
			d_card_datas_id: card.d_card_datas_id,
		}),
	).toMatchObject({ user_card_data: card });
	const decks = z
		.object({ deck_list: z.array(deckSchema) })
		.parse(await request('post', '/v1/user/deck/get_list'));
	expect(decks.deck_list).toEqual([]);
	const created = z.object({ deck_list: z.array(deckSchema) }).parse(
		await request('post', '/v1/user/deck/modify_deck_list', {
			modify_deck_list: [
				{
					deck_no: 1,
					generations_id: 1,
					deck_name: 'Initial deck',
					deck_cards_list: [],
				},
			],
		}),
	);
	const deck = created.deck_list[0];
	if (deck === undefined) throw new Error('Deck creation returned no decks');
	await request('post', '/v1/user/deck/modify_deck_list', {
		modify_deck_list: [
			{
				d_deck_datas_id: deck.d_deck_datas_id,
				deck_no: deck.deck_no,
				generations_id: deck.generations_id,
				deck_name: 'Sample deck',
				deck_cards_list: [
					{ slot_no: 1, d_card_datas_id: card.d_card_datas_id },
				],
			},
		],
	});
	expect(await request('post', '/v1/user/deck/get_list')).toMatchObject({
		deck_list: expect.arrayContaining([
			expect.objectContaining({
				d_deck_datas_id: deck.d_deck_datas_id,
				deck_name: 'Sample deck',
				deck_cards_list: [
					expect.objectContaining({
						d_card_datas_id: card.d_card_datas_id,
						slot_no: 1,
					}),
				],
			}),
		]),
	});
});

test('リズムゲームのデッキ更新と名前変更はnullを返し、変更を保持する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	expect(
		await request('post', '/v1/rhythm_game_deck/modify_deck_list', {
			modify_deck_list: [
				{ deck_no: 1, name: 'Sample deck', deck_card_list: [] },
			],
		}),
	).toBeNull();
	expect(
		await request('post', '/v1/rhythm_game_deck/set_deck_name', {
			deck_no: 1,
			name: 'Updated deck',
		}),
	).toBeNull();
	const response = await app.request('/v1/rhythm_game/home', {
		method: 'POST',
		body: '{}',
	});
	expect(response.status).toBe(200);
	const home = z
		.object({
			rhythm_game_deck_list: z.array(
				z.object({ deck_no: z.number(), name: z.string() }),
			),
		})
		.parse(await response.json());
	expect(home.rhythm_game_deck_list).toContainEqual({
		deck_no: 1,
		name: 'Updated deck',
	});
});
