import { expect, test } from 'bun:test';
import { z } from 'zod';
import { ensureGrandPrixRuntimeState } from '../../src/server-state.ts';
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
	return {
		saved,
		request: createDocumentedRequest(app),
		database: repository.selection.database,
	};
}
test('グレードクエストの開始・行動・詳細・追加スキルの実応答が契約に適合する', async () => {
	const { request, database } = await prepare();
	const series = database
		.query<{ id: number }, []>(
			'SELECT id FROM master_grade_quest_series ORDER BY id LIMIT 1',
		)
		.get();
	if (series === null) throw new Error('Missing grade quest fixture');
	const started = z
		.object({
			quest_square_list: z.array(
				z.object({ grade_quest_square_id: z.number(), status: z.number() }),
			),
		})
		.parse(
			await request('post', '/v1/out_quest_live/grade/set_quest_start', {
				grade_quest_series_id: series.id,
			}),
		);
	const square = started.quest_square_list.find((item) => item.status === 1);
	if (square === undefined) throw new Error('Missing open grade square');
	await request('post', '/v1/out_quest_live/grade/get_stage_data', {
		grade_quest_square_id: square.grade_quest_square_id,
	});
	await request('post', '/v1/out_quest_live/grade/set_quest_action', {
		grade_quest_square_id: square.grade_quest_square_id,
	});
	await request('post', '/v1/out_quest_live/grade/set_quest_add_skill', {
		grade_quest_square_id: square.grade_quest_square_id,
		grade_add_skills_id: 0,
	});
	expect(started.quest_square_list.length).toBeGreaterThan(0);
});
test('楽曲ラーニングの一覧と段階の実応答が契約に適合する', async () => {
	const { request } = await prepare();
	const result = z
		.object({
			music_list: z.array(
				z.object({
					stage_list: z.array(
						z.object({
							learning_live_stages_id: z.number(),
							is_lock: z.boolean(),
						}),
					),
				}),
			),
		})
		.parse(
			await request(
				'post',
				'/v1/out_quest_live/music_learning/get_music_select',
			),
		);
	expect(result.music_list.length).toBeGreaterThan(0);
	expect(result.music_list.some((music) => music.stage_list.length > 0)).toBe(
		true,
	);
});
test('グランプリのトップ・選択・一覧・詳細・ランキング・履歴が契約に適合する', async () => {
	const { request, database, saved } = await prepare();
	const series = database
		.query<{ id: number; grand_prixes_id: number }, []>(
			'SELECT id, grand_prixes_id FROM master_grand_prix_quest_series ORDER BY id LIMIT 1',
		)
		.get();
	if (series === null) throw new Error('Missing Grand Prix series fixture');
	const stage = database
		.query<{ id: number }, [number]>(
			'SELECT id FROM master_grand_prix_quest_stages WHERE grand_prix_series_id = ? ORDER BY id LIMIT 1',
		)
		.get(series.id);
	if (stage === null) throw new Error('Missing Grand Prix stage fixture');
	ensureGrandPrixRuntimeState(saved.getState()).activeGrandPrixId =
		series.grand_prixes_id;
	await request('post', '/v1/out_quest_live/grand_prix/get_top_info');
	await request('post', '/v1/out_quest_live/grand_prix/get_stage_select', {
		quest_id: series.id,
	});
	const stages = z
		.object({ stage_list: z.array(z.object({ stage_id: z.number() })) })
		.parse(
			await request('post', '/v1/out_quest_live/grand_prix/get_stage_list', {
				quest_id: series.id,
			}),
		);
	expect(stages.stage_list.some((item) => item.stage_id === stage.id)).toBe(
		true,
	);
	await request('post', '/v1/out_quest_live/grand_prix/get_stage_data', {
		stage_id: stage.id,
	});
	await request('post', '/v1/out_quest_live/grand_prix/get_ranking_list', {
		ranking_type: 1,
	});
	await request('post', '/v1/out_quest_live/grand_prix/get_history', {
		quest_id: series.id,
	});
});
