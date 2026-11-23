import type { Database } from 'bun:sqlite';
import {
	collectActiveMasterQueries,
	collectDerivedActiveDatabaseQueryColumns,
} from '../src/master-archive/infrastructure/active-master-query-source.ts';
import generatedManifest from '../src/master-archive/infrastructure/generated-active-master-query-manifest.json';
import type { OfficialReadModelDefinition } from '../src/master-archive/infrastructure/source-adapters/source-input.ts';

const manifest = generatedManifest as readonly OfficialReadModelDefinition[];

export async function createActiveMasterQueryTestSchema(
	database: Database,
): Promise<Awaited<ReturnType<typeof collectActiveMasterQueries>>> {
	for (const definition of manifest) {
		database.exec(
			`CREATE TABLE ${quote(definition.databaseTableName)} (${definition.columns.map((column) => `${quote(column.columnName)} ${column.type}`).join(', ')})`,
		);
	}
	const queries = await collectActiveMasterQueries(`${import.meta.dir}/..`);
	const officialNames = new Set(
		manifest.map((definition) => definition.databaseTableName),
	);
	const derivedColumns = collectDerivedActiveDatabaseQueryColumns(
		queries,
		officialNames,
	);
	for (const [tableName, columns] of derivedColumns) {
		database.exec(
			`CREATE TABLE ${quote(tableName)} (${[...columns].map((column) => `${quote(column)} INTEGER`).join(', ')})`,
		);
	}
	return queries;
}

export function activeMasterQueryManifestSize(): number {
	return manifest.length;
}

function quote(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}
