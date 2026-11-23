import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openSqliteActiveMasterRepository } from '../src/master-data/sqlite-active-master-repository.ts';
import { createActiveMasterIdentityFixture } from './masterArchive/fixtures/activeMasterIdentity.ts';

const hash = (character: string) => character.repeat(64);

describe('active master repository integration', () => {
	test('opens the existing active database readonly without generating another database', async () => {
		const root = await mkdtemp(join(tmpdir(), 'active-master-runtime-'));
		try {
			const activePath = join(root, 'active.sqlite');
			const selectedPath = join(root, 'selected-release.json');
			const database = new Database(activePath, { create: true });
			createActiveMasterIdentityFixture(database, hash('a'), hash('b'));
			database.close();
			await writeFile(
				selectedPath,
				JSON.stringify({
					schemaVersion: 1,
					releaseId: hash('a'),
					databaseFingerprint: hash('b'),
					androidResourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
					iosResourceVersion: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
				}),
			);

			const repository = openSqliteActiveMasterRepository(
				activePath,
				selectedPath,
			);
			expect(repository.selection.releaseId).toBe(hash('a'));
			expect(() =>
				repository.selection.database.exec(
					'CREATE TABLE generated (id INTEGER)',
				),
			).toThrow();
			repository.close();
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test('fails before serving when selected metadata differs from the active database', async () => {
		const root = await mkdtemp(join(tmpdir(), 'active-master-mismatch-'));
		try {
			const activePath = join(root, 'active.sqlite');
			const selectedPath = join(root, 'selected-release.json');
			const database = new Database(activePath, { create: true });
			createActiveMasterIdentityFixture(database, hash('a'), hash('b'));
			database.close();
			await writeFile(
				selectedPath,
				JSON.stringify({
					schemaVersion: 1,
					releaseId: hash('c'),
					databaseFingerprint: hash('b'),
					androidResourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
					iosResourceVersion: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
				}),
			);

			expect(() =>
				openSqliteActiveMasterRepository(activePath, selectedPath),
			).toThrow('active database release identity differs from selection');
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});
