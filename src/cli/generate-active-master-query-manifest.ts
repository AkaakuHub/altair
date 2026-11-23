import { Database } from 'bun:sqlite';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import {
	collectActiveMasterQueries,
	collectDerivedActiveDatabaseQueryColumns,
} from '../master-archive/infrastructure/active-master-query-source.ts';
import { STATIC_MASTER_SCHEMA_FIELD_SOURCES } from '../master-archive/infrastructure/static-master-schema-field-sources.ts';

type SchemaColumn = Readonly<{
	fieldCrc: number;
	columnName: string;
	type: 'INTEGER' | 'TEXT';
	binaryTypeCode: 0x10 | 0x20 | 0x33;
}>;

type TableSchema = Readonly<{
	tableLabel: string;
	databaseTableName: string;
	columns: readonly SchemaColumn[];
}>;

type ExplainRow = Readonly<{
	opcode: string;
	p1: number;
	p2: number;
}>;

const root = join(import.meta.dir, '../..');
const outputPath = join(
	root,
	'src/master-archive/infrastructure/generated-active-master-query-manifest.json',
);

const sourceDirectories: string[] = [];
for (let index = 2; index < process.argv.length; index += 1) {
	const argument = process.argv[index];
	if (argument === '--check') continue;
	if (argument !== '--source-directory')
		throw new Error(`Unknown argument: ${argument}`);
	const directory = process.argv[++index];
	if (directory === undefined)
		throw new Error('--source-directory requires a path');
	sourceDirectories.push(resolve(directory));
}
const queries = [
	...(await collectActiveMasterQueries(root)),
	...(
		await Promise.all(
			sourceDirectories.map((directory) =>
				collectActiveMasterQueries(directory, '**/*.ts'),
			),
		)
	).flat(),
];
const tableSchemas = createTableSchemas();
const selectedColumns = explainQueries(queries, tableSchemas);
const output = renderManifest(selectedColumns, tableSchemas);

if (process.argv.includes('--check')) {
	const schema = z.array(
		z.object({
			databaseTableName: z.string(),
			columns: z.array(z.record(z.string(), z.unknown())),
		}),
	);
	const declared = schema.parse(JSON.parse(readFileSync(outputPath, 'utf8')));
	for (const required of schema.parse(JSON.parse(output))) {
		const table = declared.find(
			(entry) => entry.databaseTableName === required.databaseTableName,
		);
		for (const column of required.columns) {
			const match = table?.columns.find(
				(entry) => entry.columnName === column.columnName,
			);
			if (
				match === undefined ||
				Object.entries(column).some(([key, value]) => match[key] !== value)
			) {
				throw new Error(
					`Active master read model does not cover ${required.databaseTableName}.${String(column.columnName)}`,
				);
			}
		}
	}
} else {
	writeFileSync(outputPath, output);
}

function createTableSchemas(): ReadonlyMap<string, TableSchema> {
	const sourcesByNormalizedLabel = new Map<
		string,
		(typeof STATIC_MASTER_SCHEMA_FIELD_SOURCES)[number][]
	>();
	for (const source of STATIC_MASTER_SCHEMA_FIELD_SOURCES) {
		const normalized = normalizeTableIdentity(source.tableLabel);
		const sources = sourcesByNormalizedLabel.get(normalized) ?? [];
		sources.push(source);
		sourcesByNormalizedLabel.set(normalized, sources);
	}
	const tableNames = new Set<string>();
	for (const query of queries) {
		for (const match of query.sql.matchAll(
			/\b(?:FROM|JOIN)\s+(master_[a-z0-9_]+)\b/giu,
		)) {
			const tableName = match[1];
			if (tableName) tableNames.add(tableName.toLowerCase());
		}
	}
	const result = new Map<string, TableSchema>();
	for (const databaseTableName of [...tableNames].sort()) {
		const normalized = normalizeTableIdentity(databaseTableName);
		const sources = sourcesByNormalizedLabel.get(normalized);
		if (!sources || sources.length === 0) {
			throw new Error(`Schema table is unknown: ${databaseTableName}`);
		}
		const labels = new Set(sources.map((source) => source.tableLabel));
		if (labels.size !== 1) {
			throw new Error(`Schema table is ambiguous: ${databaseTableName}`);
		}
		const candidatesByColumn = new Map<string, Map<number, SchemaColumn>>();
		for (const source of sources) {
			for (const field of source.fields) {
				if (field.officialFieldName === null) continue;
				if (
					field.typeCode !== 0x10 &&
					field.typeCode !== 0x20 &&
					field.typeCode !== 0x33
				) {
					continue;
				}
				const columnName = officialFieldNameToColumnName(
					field.officialFieldName,
				);
				const candidate: SchemaColumn = {
					fieldCrc: field.crc,
					columnName,
					type: field.typeCode === 0x10 ? 'TEXT' : 'INTEGER',
					binaryTypeCode: field.typeCode,
				};
				const candidates = candidatesByColumn.get(columnName) ?? new Map();
				const existing = candidates.get(candidate.fieldCrc);
				if (
					existing === undefined ||
					candidate.binaryTypeCode < existing.binaryTypeCode
				) {
					candidates.set(candidate.fieldCrc, candidate);
				}
				candidatesByColumn.set(columnName, candidates);
			}
		}
		const columns: SchemaColumn[] = [];
		for (const [columnName, candidates] of candidatesByColumn) {
			if (candidates.size !== 1) {
				throw new Error(
					`Schema field is ambiguous: ${databaseTableName}.${columnName}`,
				);
			}
			const candidate = candidates.values().next().value;
			if (candidate === undefined) throw new Error('Field candidate is absent');
			columns.push(candidate);
		}
		columns.sort((left, right) =>
			left.columnName.localeCompare(right.columnName),
		);
		result.set(databaseTableName, {
			tableLabel: [...labels][0] ?? '',
			databaseTableName,
			columns,
		});
	}
	return result;
}

function explainQueries(
	activeQueries: readonly Awaited<
		ReturnType<typeof collectActiveMasterQueries>
	>[number][],
	tableSchemas: ReadonlyMap<string, TableSchema>,
): ReadonlyMap<string, ReadonlySet<string>> {
	const database = new Database(':memory:');
	const selected = new Map<string, Set<string>>();
	try {
		for (const table of tableSchemas.values()) {
			database.exec(
				`CREATE TABLE ${quote(table.databaseTableName)} (${[...table.columns.map((column) => `${quote(column.columnName)} ${column.type}`), '"__row_index" INTEGER'].join(', ')})`,
			);
		}
		createReferencedDerivedTables(database, activeQueries, tableSchemas);
		for (const query of activeQueries) {
			let rows: ExplainRow[];
			try {
				const statement = database.query<ExplainRow, null[]>(
					`EXPLAIN ${query.sql}`,
				);
				const bindings = Array.from(
					{ length: countParameters(query.sql) },
					() => null,
				);
				rows = statement.all(...bindings);
			} catch (error) {
				throw new Error(
					`Active master query analysis failed at ${query.source}: ${query.sql}`,
					{ cause: error },
				);
			}
			const cursors = new Map<number, string>();
			for (const row of rows) {
				if (row.opcode !== 'OpenRead') continue;
				const tableName = database
					.query<{ name: string }, [number]>(
						"SELECT name FROM sqlite_master WHERE type = 'table' AND rootpage = ?",
					)
					.get(row.p2)?.name;
				if (tableName && tableSchemas.has(tableName)) {
					cursors.set(row.p1, tableName);
					if (!selected.has(tableName)) selected.set(tableName, new Set());
				}
			}
			for (const row of rows) {
				if (row.opcode !== 'Column') continue;
				const tableName = cursors.get(row.p1);
				if (!tableName) continue;
				const table = tableSchemas.get(tableName);
				const column = table?.columns[row.p2];
				if (table && row.p2 === table.columns.length) {
					selected.get(tableName)?.add('__row_index');
					continue;
				}
				if (!column) {
					throw new Error(`Unknown EXPLAIN column: ${tableName}:${row.p2}`);
				}
				selected.get(tableName)?.add(column.columnName);
			}
		}
	} finally {
		database.close();
	}
	return selected;
}

function renderManifest(
	selected: ReadonlyMap<string, ReadonlySet<string>>,
	tableSchemas: ReadonlyMap<string, TableSchema>,
): string {
	const definitions = [...selected]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([tableName, selectedNames]) => {
			const table = tableSchemas.get(tableName);
			if (!table)
				throw new Error(`Selected table schema is absent: ${tableName}`);
			const fieldColumns = table.columns.filter((column) =>
				selectedNames.has(column.columnName),
			);
			if (fieldColumns.length === 0 && !selectedNames.has('__row_index')) {
				const id = table.columns.find((column) => column.columnName === 'id');
				if (!id)
					throw new Error(
						`Referenced table has no selected column: ${tableName}`,
					);
				fieldColumns.push(id);
			}
			const columns = [
				...fieldColumns.map((column) => ({
					source: 'field' as const,
					...column,
				})),
				...(selectedNames.has('__row_index')
					? [
							{
								source: 'row-index' as const,
								columnName: '__row_index' as const,
								type: 'INTEGER' as const,
							},
						]
					: []),
			];
			return {
				tableLabel: table.tableLabel,
				databaseTableName: tableName,
				columns,
				primaryKey: [],
				indexes: columns.map((column) => ({
					name: `idx_${tableName}_${column.columnName}`,
					columns: [column.columnName],
					unique: false,
				})),
			};
		});
	return `${JSON.stringify(definitions, null, '\t')}\n`;
}

function createReferencedDerivedTables(
	database: Database,
	queries: readonly Awaited<
		ReturnType<typeof collectActiveMasterQueries>
	>[number][],
	tableSchemas: ReadonlyMap<string, TableSchema>,
): void {
	const definitions = collectDerivedActiveDatabaseQueryColumns(
		queries,
		new Set(tableSchemas.keys()),
	);
	for (const [tableName, columns] of definitions) {
		database.exec(
			`CREATE TABLE ${quote(tableName)} (${[...columns].map((identifier) => `${quote(identifier)} INTEGER`).join(', ')})`,
		);
	}
}

function normalizeTableIdentity(value: string): string {
	return value
		.replace(/^master_/u, '')
		.replace(/\.tsv$/u, '')
		.replace(/[^a-z0-9]/giu, '')
		.toLowerCase();
}

function officialFieldNameToColumnName(value: string): string {
	const snakeCase = value
		.replace(/([a-z0-9])([A-Z])/gu, '$1_$2')
		.replace(/[^0-9A-Za-z]+/gu, '_')
		.replace(/^_+|_+$/gu, '')
		.toLowerCase();
	if (snakeCase.length === 0) return 'value';
	return /^\d/u.test(snakeCase) ? `n_${snakeCase}` : snakeCase;
}

function countParameters(sql: string): number {
	return sql.match(/\?/gu)?.length ?? 0;
}

function quote(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}
