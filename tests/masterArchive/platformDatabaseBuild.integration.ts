import { expect, test } from 'bun:test';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createActiveDatabaseBuildPlan } from '../../src/master-archive/domain/active-database-build.ts';
import { createPlatformDatabaseBuildPlan } from '../../src/master-archive/domain/platform-database-build.ts';
import {
	SqliteActiveDatabaseVerifier,
	SqliteActiveDatabaseWriter,
} from '../../src/master-archive/infrastructure/sqlite-active-database.ts';
import { openSqliteActiveMasterRepository } from '../../src/master-data/sqlite-active-master-repository.ts';

const androidVersion = 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==';
const iosVersion = 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ==';

function profile(identity: string, name: string) {
	return createActiveDatabaseBuildPlan({
		releaseIdentity: identity.repeat(64),
		builderIdentity: 'test-builder',
		sources: [
			{
				kind: 'official-master',
				identity: identity.repeat(64),
				sha256: identity.repeat(64),
				schemaFingerprints: [],
				tables: [
					{
						name: 'master_card',
						columns: [
							{ name: 'id', type: 'INTEGER', nullable: false },
							{ name: 'name', type: 'TEXT', nullable: false },
						],
						primaryKey: ['id'],
						indexes: [],
						rows: [{ id: 1, name }],
					},
					{
						name: 'master_shared',
						columns: [{ name: 'id', type: 'INTEGER', nullable: false }],
						primaryKey: ['id'],
						indexes: [],
						rows: [{ id: 1 }],
					},
				],
			},
		],
	});
}

test('異なるOS版を1つのSQLiteに構築し、同じ表を共有して各OSの値を独立して返す', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'platform-master-'));
	try {
		const plan = createPlatformDatabaseBuildPlan({
			android: {
				plan: profile('a', 'Android value'),
				clientVersion: '5.1.0',
				resourceVersion: androidVersion,
			},
			ios: {
				plan: profile('b', 'iOS value'),
				clientVersion: '6.0.0',
				resourceVersion: iosVersion,
			},
		});
		const path = join(directory, 'active.sqlite');
		await new SqliteActiveDatabaseWriter().writeCandidate(path, plan);
		await new SqliteActiveDatabaseVerifier().verifyCandidate(path, plan);
		const selectionPath = join(directory, 'selected.json');
		const metadata = {
			schemaVersion: 1,
			releaseId: plan.releaseIdentity,
			databaseFingerprint: plan.logicalDatabaseIdentity,
			androidResourceVersion: androidVersion,
			iosResourceVersion: iosVersion,
		};
		await writeFile(selectionPath, JSON.stringify(metadata));
		const repository = openSqliteActiveMasterRepository(path, selectionPath);
		try {
			const platforms = repository.selection.platforms;
			if (platforms === undefined)
				throw new Error('Platform masters are missing');
			expect(
				platforms.android.database.query('SELECT name FROM master_card').get(),
			).toEqual({ name: 'Android value' });
			expect(
				platforms.ios.database.query('SELECT name FROM master_card').get(),
			).toEqual({ name: 'iOS value' });
			expect(platforms.android.masterReleaseId).toBe('a'.repeat(64));
			expect(platforms.ios.masterReleaseId).toBe('b'.repeat(64));
			expect(
				platforms.ios.database.query('SELECT id FROM master_shared').get(),
			).toEqual({ id: 1 });
			expect(
				platforms.android.database
					.query(
						"SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name LIKE '%master_shared'",
					)
					.get(),
			).toEqual({ count: 1 });
			expect(
				(await readdir(directory)).filter((name) => name.endsWith('.sqlite')),
			).toHaveLength(1);
		} finally {
			repository.close();
		}
		await writeFile(
			selectionPath,
			JSON.stringify({ ...metadata, iosResourceVersion: androidVersion }),
		);
		expect(() => openSqliteActiveMasterRepository(path, selectionPath)).toThrow(
			'resource versions differ',
		);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
