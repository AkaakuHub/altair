import { expect, test } from 'bun:test';
import { z } from 'zod';
import { config, createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('通常クエストの一覧・詳細・クリア状況・閲覧履歴が契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const repository = config.activeMasterRepository;
	if (repository === undefined) throw new Error('Missing master repository');
	const database = repository.selection.database;
	const stage = database
		.query<{ id: number; area_id: number }, []>(
			'SELECT id, standard_quest_areas_id AS area_id FROM master_standard_quest_stages ORDER BY id LIMIT 1',
		)
		.get();
	if (stage === null) throw new Error('Missing standard quest stage fixture');
	const list = z
		.object({
			stage_list: z.array(
				z.object({
					stage_id: z.number(),
					clear_status: z.number(),
					is_lock: z.boolean(),
				}),
			),
		})
		.parse(
			await request('post', '/v1/out_quest_live/standard/get_stage_select', {
				area_id: stage.area_id,
			}),
		);
	expect(list.stage_list).toContainEqual({
		stage_id: stage.id,
		clear_status: 0,
		is_lock: false,
	});
	const detail = z
		.object({
			view_stage_id: z.number(),
			stage_detail_list: z.array(
				z.object({
					stage_id: z.number(),
					is_skip: z.boolean(),
					clear_status: z.number(),
					stage_reward_list: z.array(z.never()),
					stage_challenge_reward_list: z.null(),
				}),
			),
			music_list: z.array(z.object({ m_musics_id: z.number() })),
		})
		.parse(
			await request('post', '/v1/out_quest_live/standard/get_stage_data', {
				area_id: stage.area_id,
				stage_id: stage.id,
			}),
		);
	expect(detail.view_stage_id).toBe(stage.id);
	expect(detail.stage_detail_list).toContainEqual({
		stage_id: stage.id,
		is_skip: false,
		clear_status: 0,
		stage_reward_list: [],
		stage_challenge_reward_list: null,
	});
	expect(detail.music_list.length).toBeGreaterThan(0);
	const source = database
		.query<{ items_id: number }, []>(
			"SELECT items_id FROM master_item_sources WHERE standard_quest_stages_id IS NOT NULL AND standard_quest_stages_id != '' ORDER BY items_id LIMIT 1",
		)
		.get();
	if (source === null) throw new Error('Missing item source fixture');
	const statuses = z
		.object({
			quest_clear_status_list: z.array(
				z.object({ quest_live_type: z.number(), star_num: z.number() }),
			),
		})
		.parse(
			await request('post', '/v1/out_quest_live/get_quest_clear_status_list', {
				items_id: source.items_id,
			}),
		);
	expect(statuses.quest_clear_status_list.length).toBeGreaterThan(0);
	expect(
		statuses.quest_clear_status_list.every(
			(item) => item.quest_live_type === 1 && item.star_num === 0,
		),
	).toBe(true);
	expect(
		await request(
			'post',
			'/v1/out_quest_live/standard/set_area_select_view_hist',
		),
	).toBeNull();
});
