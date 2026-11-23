import { Database } from 'bun:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
	ActiveDatabaseCandidatePaths,
	ActiveDatabaseCandidateVerifier,
	ActiveDatabaseCandidateWriter,
	ActiveDatabaseExchange,
} from '../application/active-database-builder.ts';
import type {
	ActiveDatabaseBuildPlan,
	ActiveDatabaseTable,
} from '../domain/active-database-build.ts';
import { requireSqliteInteger64 } from '../domain/active-database-build.ts';

export class SqliteActiveDatabaseWriter
	implements ActiveDatabaseCandidateWriter
{
	async writeCandidate(
		candidatePath: string,
		plan: ActiveDatabaseBuildPlan,
	): Promise<void> {
		await mkdir(dirname(candidatePath), { recursive: true });
		const database = new Database(candidatePath, { create: true });
		try {
			database.exec('PRAGMA journal_mode = DELETE');
			database.exec('PRAGMA foreign_keys = ON');
			database.transaction(() => {
				createMetadataTables(database);
				insertMetadata(database, plan);
				for (const table of plan.tables) writeTable(database, table);
			})();
		} finally {
			database.close();
		}
	}
}

export class SqliteActiveDatabaseVerifier
	implements ActiveDatabaseCandidateVerifier
{
	async verifyCandidate(
		candidatePath: string,
		plan: ActiveDatabaseBuildPlan,
	): Promise<void> {
		const database = new Database(candidatePath, { readonly: true });
		try {
			const integrity = database
				.query<{ integrity_check: string }, []>('PRAGMA integrity_check')
				.get();
			if (integrity?.integrity_check !== 'ok') {
				throw new Error('Candidate active database integrity check failed');
			}
			verifyTableSchema(database, {
				name: 'active_database_metadata',
				columns: [
					{ name: 'key', type: 'TEXT', nullable: false },
					{ name: 'value', type: 'TEXT', nullable: false },
				],
				primaryKey: ['key'],
				indexes: [],
				rows: [],
			});
			verifyTableSchema(database, {
				name: 'active_database_source',
				columns: [
					{ name: 'kind', type: 'TEXT', nullable: false },
					{ name: 'identity', type: 'TEXT', nullable: false },
					{ name: 'sha256', type: 'TEXT', nullable: false },
					{
						name: 'schema_fingerprints_json',
						type: 'TEXT',
						nullable: false,
					},
				],
				primaryKey: ['kind', 'identity'],
				indexes: [],
				rows: [],
			});
			const metadata = database
				.query<{ key: string; value: string }, []>(
					'SELECT key, value FROM active_database_metadata ORDER BY key',
				)
				.all();
			const values = new Map(metadata.map((entry) => [entry.key, entry.value]));
			requireMetadata(values, 'release_identity', plan.releaseIdentity);
			requireMetadata(values, 'builder_identity', plan.builderIdentity);
			requireMetadata(
				values,
				'logical_database_identity',
				plan.logicalDatabaseIdentity,
			);
			const sourceRows = database
				.query<
					{
						kind: string;
						identity: string;
						sha256: string;
						schema_fingerprints_json: string;
					},
					[]
				>(
					'SELECT kind, identity, sha256, schema_fingerprints_json FROM active_database_source ORDER BY kind, identity',
				)
				.all();
			if (sourceRows.length !== plan.sources.length) {
				throw new Error('Candidate active database source count differs');
			}
			for (const [index, source] of plan.sources.entries()) {
				const row = sourceRows[index];
				if (
					row?.kind !== source.kind ||
					row.identity !== source.identity ||
					row.sha256 !== source.sha256 ||
					row.schema_fingerprints_json !==
						JSON.stringify([...source.schemaFingerprints].sort())
				) {
					throw new Error('Candidate active database source metadata differs');
				}
			}
			for (const table of plan.tables) verifyTable(database, table);
		} finally {
			database.close();
		}
	}
}

export class NodeActiveDatabaseCandidatePaths
	implements ActiveDatabaseCandidatePaths
{
	async createCandidatePath(activePath: string): Promise<string> {
		const stagingDirectory = join(dirname(activePath), '.staging');
		await mkdir(stagingDirectory, { recursive: true });
		return join(stagingDirectory, `${randomUUID()}.sqlite`);
	}

	async discardCandidate(candidatePath: string): Promise<void> {
		await rm(candidatePath, { force: true });
		await rm(`${candidatePath}-shm`, { force: true });
		await rm(`${candidatePath}-wal`, { force: true });
	}
}

export class NodeActiveDatabaseExchange implements ActiveDatabaseExchange {
	async exchange(candidatePath: string, activePath: string): Promise<void> {
		await rename(candidatePath, activePath);
	}
}

function createMetadataTables(database: Database): void {
	database.exec(`
		CREATE TABLE active_database_metadata (
			key TEXT NOT NULL PRIMARY KEY,
			value TEXT NOT NULL
		);
		CREATE TABLE active_database_source (
			kind TEXT NOT NULL,
			identity TEXT NOT NULL,
			sha256 TEXT NOT NULL,
			schema_fingerprints_json TEXT NOT NULL,
			PRIMARY KEY (kind, identity)
		);
	`);
}

function insertMetadata(
	database: Database,
	plan: ActiveDatabaseBuildPlan,
): void {
	const metadata = database.prepare(
		'INSERT INTO active_database_metadata (key, value) VALUES (?, ?)',
	);
	metadata.run('release_identity', plan.releaseIdentity);
	metadata.run('builder_identity', plan.builderIdentity);
	metadata.run('logical_database_identity', plan.logicalDatabaseIdentity);
	const sourceStatement = database.prepare(
		'INSERT INTO active_database_source (kind, identity, sha256, schema_fingerprints_json) VALUES (?, ?, ?, ?)',
	);
	for (const source of plan.sources) {
		sourceStatement.run(
			source.kind,
			source.identity,
			source.sha256,
			JSON.stringify([...source.schemaFingerprints].sort()),
		);
	}
}

function writeTable(database: Database, table: ActiveDatabaseTable): void {
	const primaryKey =
		table.primaryKey.length === 0
			? ''
			: `, PRIMARY KEY (${table.primaryKey.map(quoteIdentifier).join(', ')})`;
	const columnDefinitions = table.columns.map(
		(column) =>
			`${quoteIdentifier(column.name)} ${column.type}${column.nullable ? '' : ' NOT NULL'}`,
	);
	database.exec(
		`CREATE TABLE ${quoteIdentifier(table.name)} (${columnDefinitions.join(', ')}${primaryKey})`,
	);
	const columnNames = table.columns.map((column) => column.name);
	const insert = database.prepare(
		`INSERT INTO ${quoteIdentifier(table.name)} (${columnNames.map(quoteIdentifier).join(', ')}) VALUES (${columnNames.map(() => '?').join(', ')})`,
	);
	for (const row of table.rows) {
		const values = columnNames.map((columnName) => {
			const value = row[columnName];
			if (value === undefined) {
				throw new Error(`Missing ${table.name}.${columnName} while writing`);
			}
			return value;
		});
		insert.run(
			...values.map((value, index) =>
				typeof value === 'bigint'
					? requireSqliteInteger64(
							value,
							`${table.name}.${columnNames[index] ?? 'unknown'}`,
						)
					: value,
			),
		);
	}
	for (const index of table.indexes) {
		database.exec(
			`CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${quoteIdentifier(index.name)} ON ${quoteIdentifier(table.name)} (${index.columns.map(quoteIdentifier).join(', ')})`,
		);
	}
}

function verifyTable(database: Database, table: ActiveDatabaseTable): void {
	verifyTableSchema(database, table);
	const count = database
		.query<{ row_count: number }, []>(
			`SELECT COUNT(*) AS row_count FROM ${quoteIdentifier(table.name)}`,
		)
		.get();
	if (count?.row_count !== table.rows.length) {
		throw new Error(
			`Candidate active database row count differs: ${table.name}`,
		);
	}
	for (const index of table.indexes) verifyIndex(database, table.name, index);
}

function verifyTableSchema(
	database: Database,
	table: ActiveDatabaseTable,
): void {
	const tableRow = database
		.query<{ name: string }, [string]>(
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
		)
		.get(table.name);
	if (tableRow?.name !== table.name) {
		throw new Error(
			`Candidate active database table is missing: ${table.name}`,
		);
	}
	const actualColumns = database
		.query<
			{
				cid: number;
				name: string;
				type: string;
				notnull: number;
				pk: number;
			},
			[]
		>(`PRAGMA table_info(${quoteIdentifier(table.name)})`)
		.all();
	if (actualColumns.length !== table.columns.length) {
		throw new Error(
			`Candidate active database column count differs: ${table.name}`,
		);
	}
	for (const [position, expected] of table.columns.entries()) {
		const actual = actualColumns[position];
		const primaryKeyPosition = table.primaryKey.indexOf(expected.name);
		if (
			actual?.cid !== position ||
			actual.name !== expected.name ||
			actual.type.toUpperCase() !== expected.type ||
			actual.notnull !== (expected.nullable ? 0 : 1) ||
			actual.pk !== (primaryKeyPosition < 0 ? 0 : primaryKeyPosition + 1)
		) {
			throw new Error(
				`Candidate active database column schema differs: ${table.name}.${expected.name}`,
			);
		}
	}
}

function verifyIndex(
	database: Database,
	tableName: string,
	index: ActiveDatabaseTable['indexes'][number],
): void {
	const indexRows = database
		.query<{ name: string; unique: number }, []>(
			`PRAGMA index_list(${quoteIdentifier(tableName)})`,
		)
		.all();
	const actualIndex = indexRows.find((row) => row.name === index.name);
	if (
		actualIndex === undefined ||
		actualIndex.unique !== (index.unique ? 1 : 0)
	) {
		throw new Error(
			`Candidate active database index schema differs: ${index.name}`,
		);
	}
	const actualColumns = database
		.query<{ seqno: number; name: string }, []>(
			`PRAGMA index_info(${quoteIdentifier(index.name)})`,
		)
		.all();
	if (
		actualColumns.length !== index.columns.length ||
		actualColumns.some(
			(column, position) =>
				column.seqno !== position || column.name !== index.columns[position],
		)
	) {
		throw new Error(
			`Candidate active database index columns differ: ${index.name}`,
		);
	}
}

function requireMetadata(
	metadata: ReadonlyMap<string, string>,
	key: string,
	expected: string,
): void {
	if (metadata.get(key) !== expected) {
		throw new Error(`Candidate active database metadata differs: ${key}`);
	}
}

function quoteIdentifier(identifier: string): string {
	return `"${identifier}"`;
}
