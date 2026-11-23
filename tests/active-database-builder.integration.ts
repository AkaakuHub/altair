import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	ActiveDatabaseBuilder,
	type ActiveDatabaseCandidateVerifier,
	type ActiveDatabaseCandidateWriter,
} from '../src/master-archive/application/active-database-builder.ts';
import type { ActiveMasterSourceResult } from '../src/master-archive/domain/active-database-build.ts';
import {
	NodeActiveDatabaseCandidatePaths,
	NodeActiveDatabaseExchange,
	SqliteActiveDatabaseVerifier,
	SqliteActiveDatabaseWriter,
} from '../src/master-archive/infrastructure/sqlite-active-database.ts';

const hash = (character: string) => character.repeat(64);

const sourceResult: ActiveMasterSourceResult = {
	kind: 'official-master',
	identity: 'decoded-fixture',
	sha256: hash('a'),
	schemaFingerprints: [hash('b')],
	tables: [
		{
			name: 'master_card_datas',
			columns: [
				{ name: 'id', type: 'INTEGER', nullable: false },
				{ name: 'long_id', type: 'INTEGER', nullable: false },
				{ name: 'name', type: 'TEXT', nullable: false },
			],
			primaryKey: ['id'],
			indexes: [
				{
					name: 'idx_master_card_datas_name',
					columns: ['name'],
					unique: false,
				},
			],
			rows: [
				{
					id: 10_104_000,
					long_id: 9_223_372_036_854_775_807n,
					name: 'Dream Believers',
				},
				{
					id: 10_104_001,
					long_id: -9_223_372_036_854_775_808n,
					name: 'On your mark',
				},
			],
		},
	],
};

describe('active database builder integration', () => {
	test('writes, verifies, and atomically activates a candidate SQLite', async () => {
		const root = await mkdtemp(join(tmpdir(), 'active-database-'));
		try {
			const activePath = join(root, 'active.sqlite');
			const builder = createBuilder(new SqliteActiveDatabaseVerifier());
			const plan = await builder.buildAndActivate({
				activePath,
				releaseIdentity: hash('c'),
				builderIdentity: 'active-db-builder-v1',
			});
			const database = new Database(activePath, { readonly: true });
			try {
				expect(
					database
						.query<{ name: string }, []>(
							'SELECT name FROM master_card_datas ORDER BY id',
						)
						.all(),
				).toEqual([{ name: 'Dream Believers' }, { name: 'On your mark' }]);
				expect(
					database
						.query<{ value: string }, []>(
							'SELECT CAST(long_id AS TEXT) AS value FROM master_card_datas ORDER BY id',
						)
						.all(),
				).toEqual([
					{ value: '9223372036854775807' },
					{ value: '-9223372036854775808' },
				]);
				expect(
					database
						.query<{ value: string }, [string]>(
							'SELECT value FROM active_database_metadata WHERE key = ?',
						)
						.get('logical_database_identity')?.value,
				).toBe(plan.logicalDatabaseIdentity);
				expect(
					database
						.query<{ name: string }, [string]>(
							"SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?",
						)
						.get('idx_master_card_datas_name')?.name,
				).toBe('idx_master_card_datas_name');
			} finally {
				database.close();
			}
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test('leaves the existing active database unchanged when verification fails', async () => {
		const root = await mkdtemp(join(tmpdir(), 'active-database-failure-'));
		try {
			const activePath = join(root, 'active.sqlite');
			const existing = Buffer.from('existing-active-database');
			await writeFile(activePath, existing);
			const verifier: ActiveDatabaseCandidateVerifier = {
				verifyCandidate: async () => {
					throw new Error('candidate rejected');
				},
			};

			await expect(
				createBuilder(verifier).buildAndActivate({
					activePath,
					releaseIdentity: hash('c'),
					builderIdentity: 'active-db-builder-v1',
				}),
			).rejects.toThrow('candidate rejected');
			expect(await readFile(activePath)).toEqual(existing);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test('rejects a candidate with the expected row count but a different table schema', async () => {
		const root = await mkdtemp(join(tmpdir(), 'active-database-schema-'));
		try {
			const activePath = join(root, 'active.sqlite');
			const existing = Buffer.from('existing-active-database');
			await writeFile(activePath, existing);
			const writer = corruptingWriter(`
				ALTER TABLE master_card_datas RENAME TO original_card_datas;
				CREATE TABLE master_card_datas (
					id TEXT NOT NULL,
					long_id INTEGER NOT NULL,
					name TEXT NOT NULL,
					PRIMARY KEY (id)
				);
				INSERT INTO master_card_datas SELECT id, long_id, name FROM original_card_datas;
				DROP TABLE original_card_datas;
				CREATE INDEX idx_master_card_datas_name ON master_card_datas(name);
			`);

			await expect(
				createBuilder(
					new SqliteActiveDatabaseVerifier(),
					writer,
				).buildAndActivate({
					activePath,
					releaseIdentity: hash('c'),
					builderIdentity: 'active-db-builder-v1',
				}),
			).rejects.toThrow(
				'Candidate active database column schema differs: master_card_datas.id',
			);
			expect(await readFile(activePath)).toEqual(existing);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});

	test('rejects an index with different uniqueness', async () => {
		const root = await mkdtemp(join(tmpdir(), 'active-database-index-'));
		try {
			const activePath = join(root, 'active.sqlite');
			const writer = corruptingWriter(`
				DROP INDEX idx_master_card_datas_name;
				CREATE UNIQUE INDEX idx_master_card_datas_name ON master_card_datas(name);
			`);

			await expect(
				createBuilder(
					new SqliteActiveDatabaseVerifier(),
					writer,
				).buildAndActivate({
					activePath,
					releaseIdentity: hash('c'),
					builderIdentity: 'active-db-builder-v1',
				}),
			).rejects.toThrow(
				'Candidate active database index schema differs: idx_master_card_datas_name',
			);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});

function createBuilder(
	verifier: ActiveDatabaseCandidateVerifier,
	writer: ActiveDatabaseCandidateWriter = new SqliteActiveDatabaseWriter(),
) {
	return new ActiveDatabaseBuilder({
		sources: [{ load: async () => sourceResult }],
		writer,
		verifier,
		exchange: new NodeActiveDatabaseExchange(),
		candidatePaths: new NodeActiveDatabaseCandidatePaths(),
	});
}

function corruptingWriter(sql: string): ActiveDatabaseCandidateWriter {
	return {
		writeCandidate: async (candidatePath, plan) => {
			await new SqliteActiveDatabaseWriter().writeCandidate(
				candidatePath,
				plan,
			);
			const database = new Database(candidatePath);
			try {
				database.exec(sql);
			} finally {
				database.close();
			}
		},
	};
}
