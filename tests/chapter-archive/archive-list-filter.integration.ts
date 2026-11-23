import { describe, expect, test } from 'bun:test';
import { createTestApp, postJson, registerNewUser } from '../test-app.ts';

type ArchiveListEntry = {
	archives_id: string;
	live_type: number;
	live_start_time: string;
	has_extra: boolean;
	has_extra_admission: boolean;
	earned_star_count: number;
};

type ArchiveListBody = {
	archive_list: ArchiveListEntry[];
};

describe('archive list filter', () => {
	test('paginates archive list by request offset and limit', async () => {
		const app = createTestApp();
		await registerNewUser(app);

		const firstPage = await getArchiveList(app, {
			order: 'desc',
			characters: [],
			limit: 16,
			sort: 'live_start_time',
		});
		const secondPage = await getArchiveList(app, {
			order: 'desc',
			characters: [],
			limit: 16,
			offset: 16,
			sort: 'live_start_time',
		});

		expect(firstPage.archive_list).toHaveLength(16);
		expect(secondPage.archive_list).toHaveLength(16);
		expect(firstPage.archive_list[0]?.archives_id).toBe(
			'8ccceeea-2c46-4ecd-a57d-703376ac5c81',
		);
		expect(secondPage.archive_list[0]?.archives_id).not.toBe(
			firstPage.archive_list[0]?.archives_id,
		);
	});

	test('filters by archive type and after state', async () => {
		const app = createTestApp();
		await registerNewUser(app);

		const withliveArchives = await getArchiveList(app, {
			order: 'desc',
			live_type: 2,
			characters: [],
			limit: 16,
			sort: 'live_start_time',
		});
		const fesArchives = await getArchiveList(app, {
			order: 'desc',
			live_type: 1,
			characters: [],
			limit: 16,
			sort: 'live_start_time',
		});
		const afterArchives = await getArchiveList(app, {
			order: 'desc',
			live_type: 2,
			has_withlive_extra: 1,
			has_withlive_extra_admission: 1,
			characters: [],
			limit: 16,
			sort: 'live_start_time',
		});
		const noAfterArchives = await getArchiveList(app, {
			order: 'desc',
			live_type: 2,
			has_withlive_extra: 2,
			has_withlive_extra_admission: 2,
			characters: [],
			limit: 16,
			sort: 'live_start_time',
		});

		expect(
			withliveArchives.archive_list.every((archive) => archive.live_type === 2),
		).toBe(true);
		expect(
			fesArchives.archive_list.every((archive) => archive.live_type === 1),
		).toBe(true);
		expect(afterArchives.archive_list).toHaveLength(0);
		expect(
			noAfterArchives.archive_list.every((archive) => !archive.has_extra),
		).toBe(true);
	}, 15_000);

	test('filters by character appearance and sorts by star count', async () => {
		const app = createTestApp();
		await registerNewUser(app);
		const archiveId = 'cb5b6ce0-0fcb-4fd2-8550-8c6628734e43';

		const giftResponse = await postJson(app, '/v1/archive/withlive_gift', {
			live_id: archiveId,
			user_item_id: '60a1fb22-1c8f-5828-b07d-c812d23a8e13',
			use_own_amount: 10,
			character_id: null,
		});
		expect(giftResponse.status).toBe(200);

		const included = await getArchiveList(app, {
			order: 'desc',
			live_type: 2,
			characters: [{ character_id: 1031, appearance: 1 }],
			limit: 16,
			sort: 'star_count',
		});
		const excluded = await getArchiveList(app, {
			order: 'desc',
			live_type: 2,
			characters: [{ character_id: 1031, appearance: 2 }],
			limit: 16,
			sort: 'star_count',
		});

		expect(included.archive_list[0]).toMatchObject({
			archives_id: archiveId,
			earned_star_count: 1,
			has_extra_admission: true,
		});
		expect(
			excluded.archive_list.some(
				(archive) => archive.archives_id === archiveId,
			),
		).toBe(false);
	}, 15_000);
});

async function getArchiveList(
	app: ReturnType<typeof createTestApp>,
	body: object,
): Promise<ArchiveListBody> {
	const response = await postJson(app, '/v1/archive/get_archive_list', body);
	expect(response.status).toBe(200);
	return (await response.json()) as ArchiveListBody;
}
