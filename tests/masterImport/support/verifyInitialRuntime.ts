import { Database } from 'bun:sqlite';
import { expect } from 'bun:test';
import { join } from 'node:path';
import { z } from 'zod';
import { OFFICIAL_READ_MODEL_DEFINITIONS } from '../../../src/master-archive/infrastructure/source-adapters/static-official-read-model-definitions.ts';
import type { ActiveMasterRepository } from '../../../src/master-data/active-master-repository.ts';
import { openSqliteActiveMasterRepository } from '../../../src/master-data/sqlite-active-master-repository.ts';
import { initializeRuntime } from '../../../src/runtime-initialization/initialize-runtime.ts';
import { createApp } from '../../../src/server.ts';
import { createTestApp, registerNewUser } from '../../test-app.ts';

export async function verifyInitialRuntime(
	input: Readonly<{
		directory: string;
		candidatePath: string;
		androidManifestPath: string;
		iosManifestPath: string;
	}>,
): Promise<void> {
	const { directory, candidatePath } = input;
	let database: Database | undefined;
	let repository: ActiveMasterRepository | undefined;
	try {
		database = new Database(candidatePath, { readonly: true });
		const tableNames = new Set(
			database
				.query<{ name: string }, []>(
					"SELECT name FROM sqlite_master WHERE type = 'table'",
				)
				.all()
				.map((row) => row.name),
		);
		expect(
			OFFICIAL_READ_MODEL_DEFINITIONS.every((definition) =>
				tableNames.has(definition.databaseTableName),
			),
		).toBe(true);
		expect(
			database
				.query<{ count: number }, []>(
					'SELECT COUNT(*) AS count FROM master_card_datas',
				)
				.get()?.count,
		).toBeGreaterThan(0);
		for (const table of [
			'archive_list',
			'archive_detail',
			'with_station_list',
			'with_station_detail',
			'top_webview_gacha_detail',
		])
			expect(
				database
					.query<{ count: number }, []>(
						`SELECT COUNT(*) AS count FROM ${table}`,
					)
					.get()?.count,
			).toBe(0);
		const selectionPath = join(directory, 'selected-release.json');
		await initializeRuntime({
			activeDatabasePath: candidatePath,
			selectedReleasePath: selectionPath,
			androidManifestPath: input.androidManifestPath,
			iosManifestPath: input.iosManifestPath,
		});
		repository = openSqliteActiveMasterRepository(candidatePath, selectionPath);
		let observedInitialState = false;
		const app = createTestApp(
			{
				requestLogEnabled: false,
				activeMasterDatabasePath: candidatePath,
				selectedMasterReleasePath: selectionPath,
				activeMasterRepository: repository,
			},
			(config) =>
				createApp(config, (application, dependencies) => {
					void application;
					expect(dependencies.state.registeredUsers).toEqual([]);
					expect(dependencies.state.circle).toBeNull();
					observedInitialState = true;
				}),
		);
		expect(observedInitialState).toBe(true);
		const response = await app.request('/v1/openapi.json');
		expect(response.status).toBe(200);
		await registerNewUser(app);
		const cards = await app.request('/v1/user/card/get_list', {
			method: 'POST',
			body: '{}',
		});
		expect(cards.status).toBe(200);
		const body = z
			.object({
				user_card_data_list: z.array(z.object({ card_datas_id: z.number() })),
			})
			.parse(await cards.json());
		expect(body.user_card_data_list.length).toBeGreaterThan(0);
	} finally {
		repository?.close();
		database?.close();
	}
}
