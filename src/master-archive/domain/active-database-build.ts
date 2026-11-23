import { createHash } from 'node:crypto';

const sha256Pattern = /^[0-9a-f]{64}$/u;
const identifierPattern = /^[a-z][a-z0-9_]*$/u;
const internalColumnIdentifiers = new Set(['__row_index']);
const sqliteIntegerMinimum = -9_223_372_036_854_775_808n;
const sqliteIntegerMaximum = 9_223_372_036_854_775_807n;

export type ActiveDatabaseValue = string | number | bigint | null;

export function requireSqliteInteger64(
	value: bigint,
	identity: string,
): bigint {
	if (value < sqliteIntegerMinimum || value > sqliteIntegerMaximum) {
		throw new Error(
			`SQLite integer is out of signed 64-bit range: ${identity}`,
		);
	}
	return value;
}

export type ActiveDatabaseColumn = Readonly<{
	name: string;
	type: 'INTEGER' | 'TEXT';
	nullable: boolean;
}>;

export type ActiveDatabaseIndex = Readonly<{
	name: string;
	columns: readonly string[];
	unique: boolean;
}>;

export type ActiveDatabaseTable = Readonly<{
	name: string;
	columns: readonly ActiveDatabaseColumn[];
	primaryKey: readonly string[];
	indexes: readonly ActiveDatabaseIndex[];
	rows: readonly Readonly<Record<string, ActiveDatabaseValue>>[];
}>;

export type ActiveMasterSourceKind = string;

export type ActiveMasterSourceResult = Readonly<{
	kind: ActiveMasterSourceKind;
	identity: string;
	sha256: string;
	schemaFingerprints: readonly string[];
	tables: readonly ActiveDatabaseTable[];
}>;

export type ActiveDatabaseBuildPlan = Readonly<{
	releaseIdentity: string;
	builderIdentity: string;
	logicalDatabaseIdentity: string;
	sources: readonly ActiveMasterSourceResult[];
	tables: readonly ActiveDatabaseTable[];
}>;

export function createActiveDatabaseBuildPlan(input: {
	releaseIdentity: string;
	builderIdentity: string;
	sources: readonly ActiveMasterSourceResult[];
}): ActiveDatabaseBuildPlan {
	requireSha256(input.releaseIdentity, 'release identity');
	requireIdentity(input.builderIdentity, 'builder identity');
	const sources = [...input.sources].sort(compareSources);
	const sourceKeys = new Set<string>();
	const tableNames = new Set<string>();
	for (const source of sources) {
		requireIdentity(source.identity, 'source identity');
		requireSha256(source.sha256, 'source hash');
		for (const fingerprint of source.schemaFingerprints) {
			requireSha256(fingerprint, 'schema fingerprint');
		}
		const sourceKey = `${source.kind}:${source.identity}`;
		if (sourceKeys.has(sourceKey)) {
			throw new Error(`Duplicate active master source: ${sourceKey}`);
		}
		sourceKeys.add(sourceKey);
		for (const table of source.tables) {
			validateTable(table);
			if (tableNames.has(table.name)) {
				throw new Error(`Duplicate active database table: ${table.name}`);
			}
			tableNames.add(table.name);
		}
	}
	const tables = sources
		.flatMap((source) => source.tables)
		.sort((left, right) => left.name.localeCompare(right.name));
	const logicalDatabaseIdentity = createHash('sha256')
		.update(
			JSON.stringify(
				{
					releaseIdentity: input.releaseIdentity,
					builderIdentity: input.builderIdentity,
					sources: sources.map((source) => ({
						kind: source.kind,
						identity: source.identity,
						sha256: source.sha256,
						schemaFingerprints: [...source.schemaFingerprints].sort(),
					})),
					tables,
				},
				serializeDatabaseValue,
			),
		)
		.digest('hex');
	return {
		releaseIdentity: input.releaseIdentity,
		builderIdentity: input.builderIdentity,
		logicalDatabaseIdentity,
		sources,
		tables,
	};
}

function compareSources(
	left: ActiveMasterSourceResult,
	right: ActiveMasterSourceResult,
): number {
	return `${left.kind}:${left.identity}`.localeCompare(
		`${right.kind}:${right.identity}`,
	);
}

function validateTable(table: ActiveDatabaseTable): void {
	requireIdentifier(table.name, 'table');
	if (table.columns.length === 0) {
		throw new Error(`Active database table has no columns: ${table.name}`);
	}
	const columns = new Map<string, ActiveDatabaseColumn>();
	for (const column of table.columns) {
		requireIdentifier(column.name, 'column');
		if (columns.has(column.name)) {
			throw new Error(`Duplicate column in ${table.name}: ${column.name}`);
		}
		columns.set(column.name, column);
	}
	for (const primaryKeyColumn of table.primaryKey) {
		if (!columns.has(primaryKeyColumn)) {
			throw new Error(
				`Unknown primary key column in ${table.name}: ${primaryKeyColumn}`,
			);
		}
	}
	const indexes = new Set<string>();
	for (const index of table.indexes) {
		requireIdentifier(index.name, 'index');
		if (indexes.has(index.name)) {
			throw new Error(`Duplicate index in ${table.name}: ${index.name}`);
		}
		indexes.add(index.name);
		if (index.columns.length === 0) {
			throw new Error(`Index has no columns: ${index.name}`);
		}
		for (const columnName of index.columns) {
			if (!columns.has(columnName)) {
				throw new Error(`Unknown index column in ${index.name}: ${columnName}`);
			}
		}
	}
	for (const [rowIndex, row] of table.rows.entries()) {
		for (const column of table.columns) {
			if (!(column.name in row)) {
				throw new Error(
					`Missing ${table.name}.${column.name} in row ${rowIndex}`,
				);
			}
			const value = row[column.name];
			if (value === null && !column.nullable) {
				throw new Error(`Null ${table.name}.${column.name} in row ${rowIndex}`);
			}
			if (
				value !== null &&
				((column.type === 'INTEGER' &&
					typeof value !== 'number' &&
					typeof value !== 'bigint') ||
					(column.type === 'TEXT' && typeof value !== 'string'))
			) {
				throw new Error(
					`Invalid ${table.name}.${column.name} value in row ${rowIndex}`,
				);
			}
			if (typeof value === 'bigint') {
				requireSqliteInteger64(
					value,
					`${table.name}.${column.name} in row ${rowIndex}`,
				);
			}
		}
		for (const rowColumn of Object.keys(row)) {
			if (!columns.has(rowColumn)) {
				throw new Error(`Unknown ${table.name} row column: ${rowColumn}`);
			}
		}
	}
}

function serializeDatabaseValue(_key: string, value: unknown): unknown {
	return typeof value === 'bigint' ? { integer64: value.toString() } : value;
}

function requireIdentifier(value: string, kind: string): void {
	if (
		!identifierPattern.test(value) &&
		!(kind === 'column' && internalColumnIdentifiers.has(value))
	) {
		throw new Error(`Invalid active database ${kind} identifier: ${value}`);
	}
}

function requireSha256(value: string, kind: string): void {
	if (!sha256Pattern.test(value)) throw new Error(`Invalid ${kind}`);
}

function requireIdentity(value: string, kind: string): void {
	if (value.length === 0) throw new Error(`Invalid ${kind}`);
}
