import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createInMemoryServerStateStore } from '../support/inMemoryServerStateStore.ts';
import { config, createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

async function prepare() {
	const saved = createInMemoryServerStateStore();
	const app = createTestApp({
		requestLogEnabled: false,
		stateStore: saved.store,
	});
	await registerNewUser(app);
	const repository = config.activeMasterRepository;
	if (repository === undefined) throw new Error('Missing master repository');
	const stage = repository.selection.database
		.query<{ id: number }, []>(
			'SELECT id FROM master_standard_quest_stages WHERE quest_musics_type = 2 AND quest_musics_detail > 0 ORDER BY id LIMIT 1',
		)
		.get();
	if (stage === null) throw new Error('Missing fixed-music stage fixture');
	const request = createDocumentedRequest(app);
	const cards = z
		.object({
			user_card_data_list: z.array(z.object({ d_card_datas_id: z.string() })),
		})
		.parse(await request('post', '/v1/user/card/get_list'));
	const card = cards.user_card_data_list[0];
	if (card === undefined) throw new Error('Missing initial card fixture');
	await request('post', '/v1/user/deck/modify_deck_list', {
		modify_deck_list: [
			{
				deck_no: 1,
				generations_id: 1,
				deck_name: 'Sample deck',
				deck_cards_list: [
					{ slot_no: 1, d_card_datas_id: card.d_card_datas_id },
				],
			},
		],
	});
	return { saved, request, stage };
}

test('ライブ設定から開始・進行情報・終了・リタイアまで実応答が契約に適合する', async () => {
	const { saved, request, stage } = await prepare();
	const setting = z
		.object({
			quest_live_type: z.number(),
			stage_id: z.number(),
			deck_data: z.array(z.object({ d_deck_datas_id: z.string() })),
			music_list: z.array(z.object({ m_musics_id: z.number() })),
		})
		.parse(
			await request('post', '/v1/out_quest_live/get_live_setting', {
				quest_live_type: 1,
				stage_id: stage.id,
			}),
		);
	const deck = setting.deck_data[0];
	const music = setting.music_list[0];
	if (deck === undefined || music === undefined)
		throw new Error('Missing quest deck or music fixture');
	expect(setting.stage_id).toBe(stage.id);
	const liveSchema = z.object({
		result: z.boolean(),
		quest_live_id: z.string(),
		quest_id: z.number(),
		quest_live_type: z.number(),
		music_id: z.number(),
		is_challenge_mode: z.boolean(),
		grand_prix_is_rehearsal: z.boolean(),
		deck_data: z.object({ d_deck_datas_id: z.string() }),
	});
	const selected = liveSchema.parse(
		await request('post', '/v1/out_quest_live/set_live_setting', {
			quest_live_type: 1,
			stage_id: stage.id,
			music_id: music.m_musics_id,
			deck_id: deck.d_deck_datas_id,
			is_challenge_mode: true,
			is_rehearsal: true,
		}),
	);
	expect(selected).toMatchObject({
		result: true,
		quest_id: stage.id,
		quest_live_type: 1,
		music_id: music.m_musics_id,
		is_challenge_mode: true,
		grand_prix_is_rehearsal: true,
		deck_data: { d_deck_datas_id: deck.d_deck_datas_id },
	});
	expect(
		liveSchema.parse(await request('post', '/v1/in_quest_live/get_live_info')),
	).toEqual(selected);
	const started = z
		.object({ quest_start_time: z.string().min(1) })
		.parse(await request('post', '/v1/in_quest_live/set_start'));
	const live = saved.getState().userLives[0]?.currentQuestLive;
	if (live == null) throw new Error('Missing current quest live');
	expect(live.startTime).toBe(started.quest_start_time);
	expect(live.questLiveId).toBe(selected.quest_live_id);
	await request('post', '/v1/in_quest_live/set_start', {
		quest_live_id: 'sample-live',
	});
	expect(live.questLiveId).toBe('sample-live');
	expect(
		await request('post', '/v1/in_quest_live/set_finish', {
			score: 12345,
			play_report: '{}',
		}),
	).toEqual({
		quest_live_type: 1,
		quest_result: true,
		return_resource: 0,
		applied_campaign_types: [],
	});
	expect(live).toMatchObject({ score: 12345, playReport: '{}' });
	expect(await request('post', '/v1/in_quest_live/set_retire')).toEqual({
		quest_live_type: 1,
		return_resource: 0,
	});
	expect(saved.getState().userLives[0]?.currentQuestLive).toBeNull();
});

test('固定楽曲ステージで設定の任意項目を省略しても契約に適合する', async () => {
	const { request, stage } = await prepare();
	expect(
		await request('post', '/v1/out_quest_live/set_live_setting', {
			quest_live_type: 1,
			stage_id: stage.id,
		}),
	).toMatchObject({
		result: true,
		quest_id: stage.id,
		is_challenge_mode: false,
		grand_prix_is_rehearsal: false,
		deck_data: {},
	});
});
