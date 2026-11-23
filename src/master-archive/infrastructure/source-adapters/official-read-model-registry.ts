import type { MasterFieldNameRegistry } from '../../domain/master-resource-import.ts';
import type { OfficialReadModelDefinition } from './source-input.ts';

export function validateOfficialReadModelDefinitions(
	definitions: readonly OfficialReadModelDefinition[],
	fieldNames: MasterFieldNameRegistry,
): readonly OfficialReadModelDefinition[] {
	const tableLabels = new Set<string>();
	const databaseTableNames = new Set<string>();
	const indexNames = new Set<string>();
	for (const definition of definitions) {
		if (tableLabels.has(definition.tableLabel)) {
			throw new Error(
				`Duplicate official master table label: ${definition.tableLabel}`,
			);
		}
		tableLabels.add(definition.tableLabel);
		if (databaseTableNames.has(definition.databaseTableName)) {
			throw new Error(
				`Duplicate official read model table: ${definition.databaseTableName}`,
			);
		}
		databaseTableNames.add(definition.databaseTableName);
		if (definition.columns.length === 0) {
			throw new Error(
				`Official read model has no columns: ${definition.databaseTableName}`,
			);
		}
		const columnNames = new Set<string>();
		const fieldCrcs = new Set<number>();
		for (const column of definition.columns) {
			if (columnNames.has(column.columnName)) {
				throw new Error(
					`Duplicate official read model column: ${definition.databaseTableName}.${column.columnName}`,
				);
			}
			columnNames.add(column.columnName);
			if (column.source === 'row-index') continue;
			if (fieldCrcs.has(column.fieldCrc)) {
				throw new Error(
					`Duplicate official read model field CRC: ${definition.tableLabel}:${column.fieldCrc}`,
				);
			}
			fieldCrcs.add(column.fieldCrc);
			const expectedSqlType =
				column.binaryTypeCode === 0x10 ? 'TEXT' : 'INTEGER';
			if (column.type !== expectedSqlType) {
				throw new Error(
					`Official read model SQLite type differs from the binary type: ${definition.tableLabel}:${column.fieldCrc}`,
				);
			}
			const officialFieldName = fieldNames.resolve({
				tableLabel: definition.tableLabel,
				fieldIndex: 0,
				fieldCrc: column.fieldCrc,
				typeCode: column.binaryTypeCode,
			});
			if (officialFieldName === null) {
				throw new Error(
					`Official read model field has no matching schema field: ${definition.tableLabel}:${column.fieldCrc}:${column.binaryTypeCode}`,
				);
			}
			if (
				officialFieldNameToColumnName(officialFieldName) !== column.columnName
			) {
				throw new Error(
					`Official read model column differs from the official field name: ${definition.databaseTableName}.${column.columnName}`,
				);
			}
		}
		for (const primaryKeyColumn of definition.primaryKey) {
			if (!columnNames.has(primaryKeyColumn)) {
				throw new Error(
					`Unknown official read model primary key column: ${definition.databaseTableName}.${primaryKeyColumn}`,
				);
			}
		}
		for (const index of definition.indexes) {
			if (indexNames.has(index.name)) {
				throw new Error(`Duplicate official read model index: ${index.name}`);
			}
			indexNames.add(index.name);
			if (index.columns.length === 0) {
				throw new Error(
					`Official read model index has no columns: ${index.name}`,
				);
			}
			for (const indexColumn of index.columns) {
				if (!columnNames.has(indexColumn)) {
					throw new Error(
						`Unknown official read model index column: ${index.name}.${indexColumn}`,
					);
				}
			}
		}
	}
	return definitions;
}

export function officialFieldNameToColumnName(value: string): string {
	const snakeCase = value
		.replace(/([a-z0-9])([A-Z])/gu, '$1_$2')
		.replace(/[^0-9A-Za-z]+/gu, '_')
		.replace(/^_+|_+$/gu, '')
		.toLowerCase();
	if (snakeCase.length === 0) return 'value';
	return /^\d/u.test(snakeCase) ? `n_${snakeCase}` : snakeCase;
}
