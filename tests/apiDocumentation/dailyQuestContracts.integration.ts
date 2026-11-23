import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createInMemoryServerStateStore } from '../support/inMemoryServerStateStore.ts';
import { config, createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('デイリークエストの一覧・詳細・回数回復がSwagger契約に適合する', async () => {
	const saved = createInMemoryServerStateStore();
	const app = createTestApp({
		requestLogEnabled: false,
		stateStore: saved.store,
		currentDate: () => new Date('2026-01-01T00:00:00Z'),
	});
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const repository = config.activeMasterRepository;
	if (repository === undefined) throw new Error('Missing master repository');
	const stage = repository.selection.database
		.query<{ id: number; daily_quest_series_id: number }, []>(
			'SELECT id, daily_quest_series_id FROM master_daily_quest_stages ORDER BY id LIMIT 1',
		)
		.get();
	if (stage === null) throw new Error('Daily quest fixture has no stages');
	const list = z
		.object({ stage_list: z.array(z.object({ stage_id: z.number() })) })
		.parse(
			await request('post', '/v1/out_quest_live/daily/get_stage_list', {
				quest_id: stage.daily_quest_series_id,
			}),
		);
	expect(list.stage_list).toContainEqual({ stage_id: stage.id });
	const detail = z
		.object({
			stage_id: z.number(),
			music_list: z.array(
				z.object({ m_musics_id: z.number(), is_enable: z.boolean() }),
			),
		})
		.parse(
			await request('post', '/v1/out_quest_live/daily/get_stage_data', {
				stage_id: stage.id,
			}),
		);
	expect(detail.stage_id).toBe(stage.id);
	expect(detail.music_list.length).toBeGreaterThan(0);
	const infoSchema = z.object({
		challenge_count: z.number(),
		recovery_count: z.number(),
	});
	const before = infoSchema.parse(
		await request(
			'post',
			'/v1/out_quest_live/daily/get_recovery_challenge_count',
		),
	);
	await request('post', '/v1/user/card/get_list');
	const status = saved.getState().userStatuses[0];
	if (status === undefined) throw new Error('Missing user status');
	status.jewelFree = 100;
	expect(
		await request('post', '/v1/out_quest_live/daily/recovery_challenge_count', {
			recovery_count: 1,
		}),
	).toEqual({ challenge_count: before.challenge_count + 1 });
	expect(status.jewelFree).toBe(60);
	const after = infoSchema.parse(
		await request(
			'post',
			'/v1/out_quest_live/daily/get_recovery_challenge_count',
		),
	);
	expect(after.challenge_count).toBe(before.challenge_count + 1);
	expect(after.recovery_count).toBe(before.recovery_count + 1);
});
