import type { ActiveMasterSource } from '../../application/active-database-builder.ts';
import type {
	ActiveDatabaseColumn,
	ActiveDatabaseTable,
	ActiveMasterSourceResult,
} from '../../domain/active-database-build.ts';
import type {
	GenericMasterCell,
	GenericMasterTable,
} from '../../domain/generic-master-binary.ts';
import { officialFieldNameToColumnName } from './official-read-model-registry.ts';
import type {
	OfficialDecodedTable,
	OfficialReadModelDefinition,
} from './source-input.ts';

export class OfficialMasterSourceAdapter implements ActiveMasterSource {
	constructor(
		private readonly input: Readonly<{
			identity: string;
			sha256: string;
			tables: readonly OfficialDecodedTable[];
			readModels: readonly OfficialReadModelDefinition[];
		}>,
	) {}

	async load(): Promise<ActiveMasterSourceResult> {
		const readModels = new Map(
			this.input.readModels.map((definition) => [
				definition.tableLabel,
				definition,
			]),
		);
		const tables = this.input.tables.map((decoded) => {
			const definition = readModels.get(decoded.tableLabel);
			if (definition === undefined) {
				throw new Error(
					`Official read model is not defined: ${decoded.tableLabel}`,
				);
			}
			return mapOfficialTable(decoded.table, definition);
		});
		return {
			kind: 'official-master',
			identity: this.input.identity,
			sha256: this.input.sha256,
			schemaFingerprints: this.input.tables.map(
				(table) => table.schemaFingerprint,
			),
			tables,
		};
	}
}

function mapOfficialTable(
	table: GenericMasterTable,
	definition: OfficialReadModelDefinition,
): ActiveDatabaseTable {
	const fieldsByColumnName = officialMasterFieldsByColumnName(table);
	const columns: ActiveDatabaseColumn[] = definition.columns.map((column) => {
		if (column.source === 'row-index') {
			return { name: column.columnName, type: column.type, nullable: false };
		}
		const field = fieldsByColumnName.get(column.columnName);
		if (field === undefined || field.officialFieldName === null) {
			throw new Error(
				`Official read model field is unresolved: ${definition.tableLabel}:${column.fieldCrc}`,
			);
		}
		if (field.typeCode !== column.binaryTypeCode) {
			throw new Error(
				`Official read model binary type differs: ${definition.tableLabel}:${column.fieldCrc}`,
			);
		}
		const expectedType = field.typeName === 'string' ? 'TEXT' : 'INTEGER';
		if (expectedType !== column.type) {
			throw new Error(
				`Official read model field type differs: ${definition.tableLabel}:${column.fieldCrc}`,
			);
		}
		return { name: column.columnName, type: column.type, nullable: false };
	});
	return {
		name: definition.databaseTableName,
		columns,
		primaryKey: definition.primaryKey,
		indexes: definition.indexes,
		rows: table.rows.map((row) =>
			Object.fromEntries(
				definition.columns.map((column) => {
					if (column.source === 'row-index') {
						return [column.columnName, row.index];
					}
					const field = fieldsByColumnName.get(column.columnName);
					if (field === undefined) throw new Error('Official field is absent');
					const cell = row.cells[field.index];
					if (cell === undefined) throw new Error('Official cell is absent');
					return [column.columnName, cellValue(cell)];
				}),
			),
		),
	};
}

function cellValue(cell: GenericMasterCell): string | number | bigint {
	return cell.kind === 'int64' ? BigInt(cell.value) : cell.value;
}

export function officialMasterFieldsByColumnName(table: GenericMasterTable) {
	const fields = new Map<string, GenericMasterTable['fields'][number]>();
	for (const field of table.fields) {
		if (field.officialFieldName === null)
			throw new Error('Official field name is unresolved');
		const name = officialFieldNameToColumnName(field.officialFieldName);
		if (fields.has(name))
			throw new Error(`Official field column is ambiguous: ${name}`);
		fields.set(name, field);
	}
	return fields;
}
