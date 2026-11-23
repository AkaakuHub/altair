import { describe, expect, test } from 'bun:test';
import { createTestApp, registerNewUser } from './test-app.ts';

describe('collection flow', () => {
	test('serves music and gallary lists from YAML master-data', async () => {
		const app = createTestApp();
		await registerNewUser(app);

		const musicResponse = await app.request('/v1/collection/get_music_list', {
			method: 'POST',
			body: JSON.stringify({}),
		});
		expect(musicResponse.status).toBe(200);
		const musicBody = (await musicResponse.json()) as {
			music_info_list: Array<{ musics_id: number }>;
		};
		expect(musicBody.music_info_list).toHaveLength(236);
		expect(musicBody.music_info_list[0]?.musics_id).toBe(103101);
		expect(musicBody.music_info_list.at(-1)?.musics_id).toBe(405305);

		const gallaryResponse = await app.request(
			'/v1/collection/get_gallary_list',
			{
				method: 'POST',
				body: JSON.stringify({}),
			},
		);
		expect(gallaryResponse.status).toBe(200);
		const gallaryBody = (await gallaryResponse.json()) as {
			gallary_info_list: Array<{ comics_id: number; name: string }>;
		};
		expect(gallaryBody.gallary_info_list).toHaveLength(197);
		expect(gallaryBody.gallary_info_list[0]).toEqual({
			comics_id: 10001,
			name: '入学準備編 第1話',
		});
		expect(gallaryBody.gallary_info_list.at(-1)).toEqual({
			comics_id: 13050,
			name: '第50話',
		});
	});
});
