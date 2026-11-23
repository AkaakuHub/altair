import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('コレクションの楽曲・ギャラリー・スタンプ・人物がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const cards = z
		.object({
			user_card_data_list: z.array(z.object({ character_id: z.number() })),
		})
		.parse(await request('post', '/v1/user/card/get_list'));
	const card = cards.user_card_data_list[0];
	if (card === undefined) throw new Error('Card fixture has no owned cards');
	const music = z
		.object({ music_info_list: z.array(z.object({ musics_id: z.number() })) })
		.parse(await request('post', '/v1/collection/get_music_list'));
	expect(music.music_info_list.length).toBeGreaterThan(0);
	const gallery = z
		.object({
			gallary_info_list: z.array(
				z.object({ comics_id: z.number(), name: z.string() }),
			),
		})
		.parse(await request('post', '/v1/collection/get_gallary_list'));
	expect(gallery.gallary_info_list.length).toBeGreaterThan(0);
	const stickers = z
		.object({
			sticker_info_list: z.array(z.object({ stickers_id: z.number() })),
		})
		.parse(await request('post', '/v1/collection/get_sticker_list'));
	expect(stickers.sticker_info_list.length).toBeGreaterThan(0);
	const character = z
		.object({
			collection_character_info: z.object({
				character_id: z.number(),
				card_list: z.array(z.object({ card_datas_id: z.number() })),
			}),
		})
		.parse(
			await request('post', '/v1/collection/get_character_info', {
				character_id: card.character_id,
			}),
		);
	expect(character.collection_character_info.character_id).toBe(
		card.character_id,
	);
	expect(character.collection_character_info.card_list.length).toBeGreaterThan(
		0,
	);
});
