import { describe, expect, test } from 'bun:test';
import { createTestApp, postJson, registerNewUser } from '../test-app.ts';

describe('archive with station list', () => {
	test('serves official list metadata for the With×STATION archive list', async () => {
		const app = createTestApp();
		await registerNewUser(app);

		const response = await postJson(app, '/v1/archive/get_with_station_list', {
			order: 'desc',
			characters: [],
			limit: 16,
			sort: 'live_start_time',
		});
		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			with_station_list: Array<{
				live_id: string;
				interaction_start_time: string;
			}>;
			filterable_characters: Array<{ character_id: number; label: string }>;
			sortable_fields: Array<{ key: string; label: string }>;
		};

		expect(body.with_station_list).toHaveLength(5);
		expect(body.with_station_list[0]).toMatchObject({
			live_id: 'bc8d535f-968b-49e9-b4f1-18979c0666d9',
			interaction_start_time: '2026-04-16T12:00:00Z',
		});
		expect(body.filterable_characters).toContainEqual({
			character_id: 1031,
			label: '花帆',
		});
		expect(body.sortable_fields).toContainEqual({
			key: 'live_start_time',
			label: '日付順',
		});
		expect(body.sortable_fields).toContainEqual({
			key: 'star_count',
			label: 'With Starの数',
		});
	});
});
