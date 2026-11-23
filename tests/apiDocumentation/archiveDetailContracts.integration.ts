import { Database } from 'bun:sqlite';
import { expect, test } from 'bun:test';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import {
	getArchiveDetailFromDatabase,
	getWithStationDetailFromDatabase,
} from '../../src/v1/active-master-database/archive-detail-response-service.ts';
import { createContractValidator } from '../../tools/apiDocumentation/contractValidation.ts';
import { config, createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('保存した全アーカイブの詳細と実APIの応答を共通契約へ照合する', async () => {
	const database = new Database(config.activeMasterDatabasePath, {
		readonly: true,
	});
	try {
		const app = createTestApp({ requestLogEnabled: false });
		const document = createGameOpenApiDocument(app.routes);
		const validate = createContractValidator(document.components.schemas);
		const request = createDocumentedRequest(app);
		await registerNewUser(app);
		for (const kind of ['archive', 'station'] as const) {
			const path =
				kind === 'archive'
					? '/v1/archive/get_with_archive_data'
					: '/v1/archive/get_with_station_data';
			const schema =
				document.paths[path]?.post?.responses['200']?.content?.[
					'application/json'
				].schema;
			if (schema === undefined) throw new Error('Archive contract missing');
			const rows =
				kind === 'archive'
					? database
							.query<{ id: string }, []>(
								'SELECT archives_id AS id FROM archive_detail',
							)
							.all()
					: database
							.query<{ id: string }, []>(
								'SELECT live_id AS id FROM with_station_detail',
							)
							.all();
			expect(rows.length).toBeGreaterThan(0);
			for (const row of rows) {
				const detail =
					kind === 'archive'
						? getArchiveDetailFromDatabase(database, row.id, false)
						: getWithStationDetailFromDatabase(database, row.id, false);
				expect(detail).toBeDefined();
				validate(schema, detail?.response.body);
			}
			const first = rows[0];
			if (first === undefined) throw new Error('Archive fixture missing');
			await request(
				'post',
				path,
				kind === 'archive'
					? { archives_id: first.id }
					: { withstation_id: first.id },
			);
		}
	} finally {
		database.close();
	}
}, 60000);
