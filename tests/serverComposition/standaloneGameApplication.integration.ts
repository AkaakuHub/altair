import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { externalFixturePath } from '../externalFixtures/sourcePath.ts';

test('本体APIを起動し、Swaggerと新規登録を検証する', async () => {
	const repository = resolve(import.meta.dir, '../..');
	const child = Bun.spawn(
		[
			'bun',
			join(
				repository,
				'tests/serverComposition/fixtures/standaloneGameApplication.ts',
			),
			externalFixturePath('runtime'),
		],
		{
			cwd: repository,
			stdout: 'pipe',
			stderr: 'pipe',
		},
	);
	const [status, output, error] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	if (status !== 0) throw new Error(`Standalone application failed: ${error}`);
	const result = z
		.object({
			documentStatus: z.number(),
			contractSchemaCount: z.number(),
			typedExample: z.object({ live_id: z.string() }),
			uiStatus: z.number(),
			adminStatus: z.number(),
			paths: z.array(z.string()),
			initial: z.object({
				userCount: z.number(),
				circleIsEmpty: z.boolean(),
			}),
			onboarding: z.object({
				cardIds: z.array(z.number()),
				items: z.array(z.object({ item_id: z.number(), item_num: z.number() })),
				restoredCards: z.array(z.object({ card_datas_id: z.number() })),
				restoredItems: z.array(
					z.object({ item_id: z.number(), item_num: z.number() }),
				),
				playerName: z.string(),
			}),
		})
		.parse(JSON.parse(output));
	expect(result).toMatchObject({
		documentStatus: 200,
		uiStatus: 200,
		adminStatus: 404,
	});
	expect(result.contractSchemaCount).toBeGreaterThan(0);
	expect(result.typedExample).toEqual({ live_id: 'sample' });
	expect(result.initial).toEqual({ userCount: 0, circleIsEmpty: true });
	const seedRoot = join(repository, 'official-user-initial-state');
	const cardSeed = z
		.object({
			user_card_data_list: z.array(z.object({ card_datas_id: z.number() })),
		})
		.parse(
			JSON.parse(
				await readFile(
					join(seedRoot, 'user_card_get_list_official.json'),
					'utf8',
				),
			),
		);
	const itemSeed = z
		.object({
			item_category_list: z.array(
				z.object({
					user_item_list: z.array(
						z.object({ item_id: z.number(), item_num: z.number() }),
					),
				}),
			),
		})
		.parse(
			JSON.parse(
				await readFile(
					join(seedRoot, 'user_items_get_list_official.json'),
					'utf8',
				),
			),
		);
	expect(result.onboarding.cardIds).toEqual(
		cardSeed.user_card_data_list.map((card) => card.card_datas_id),
	);
	expect(result.onboarding.items).toEqual(
		itemSeed.item_category_list.flatMap((category) => category.user_item_list),
	);
	expect(result.onboarding.restoredCards).toEqual(cardSeed.user_card_data_list);
	expect(result.onboarding.restoredItems).toEqual(result.onboarding.items);
	expect(result.onboarding.playerName).toBe('分離確認');
	expect(result.paths.length).toBeGreaterThan(0);
	expect(result.paths.every((path) => path.startsWith('/v1/'))).toBe(true);
}, 120_000);
