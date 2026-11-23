import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('共通・初心者ミッションの一覧・共通報酬・一括受取がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	await request('post', '/v1/mission/get_list');
	await request('post', '/v1/mission/receive_common_mission_reward');
	const list = z
		.object({
			mission_category_list: z.array(z.object({ mission_type: z.number() })),
		})
		.parse(await request('post', '/v1/beginner_mission/get_list'));
	const category = list.mission_category_list[0];
	if (category === undefined)
		throw new Error('Beginner mission fixture has no categories');
	const receipt = z.object({ mission_id_list: z.array(z.number()) }).parse(
		await request('post', '/v1/beginner_mission/set_reward_all', {
			mission_type: category.mission_type,
		}),
	);
	const after = z
		.object({
			mission_category_list: z.array(
				z.object({
					mission_type: z.number(),
					mission_list: z.array(
						z.object({ mission_id: z.number(), status: z.number() }),
					),
				}),
			),
		})
		.parse(await request('post', '/v1/beginner_mission/get_list'));
	const saved = after.mission_category_list.find(
		(entry) => entry.mission_type === category.mission_type,
	);
	expect(saved).toBeDefined();
	for (const missionId of receipt.mission_id_list)
		expect(
			saved?.mission_list.find((entry) => entry.mission_id === missionId)
				?.status,
		).toBe(2);
});
