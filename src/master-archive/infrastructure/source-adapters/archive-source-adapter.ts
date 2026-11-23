import type { ActiveMasterSource } from '../../application/active-database-builder.ts';
import type {
	ActiveDatabaseColumn,
	ActiveDatabaseTable,
	ActiveDatabaseValue,
	ActiveMasterSourceResult,
} from '../../domain/active-database-build.ts';
import { archiveReadModelFields } from './archive/read-model-fields.ts';
import { requireRecord, requireString } from './json-value.ts';
import type { ArchiveSourceExtension } from './source-input.ts';
import {
	type ArchiveFilterableCharacter,
	type SavedJsonDocument,
	sourceSetHash,
	sourceSetIdentity,
} from './source-input.ts';

export class ArchiveSourceAdapter implements ActiveMasterSource {
	constructor(
		private readonly documents: Readonly<{
			archiveList: SavedJsonDocument;
			archiveDetails: SavedJsonDocument;
			withStationList: SavedJsonDocument;
			withStationDetails: SavedJsonDocument;
			extension?: ArchiveSourceExtension;
			filterableCharacters: readonly ArchiveFilterableCharacter[];
			filterableCharacterIdentity: string;
			filterableCharacterSha256: string;
		}>,
	) {}

	async load(): Promise<ActiveMasterSourceResult> {
		const sources = [
			this.documents.archiveList,
			this.documents.archiveDetails,
			this.documents.withStationList,
			this.documents.withStationDetails,
			...(this.documents.extension?.documents ?? []),
			{
				identity: this.documents.filterableCharacterIdentity,
				sha256: this.documents.filterableCharacterSha256,
				value: this.documents.filterableCharacters,
			},
			archiveSortableFieldsDocument,
		];
		return {
			kind: 'archive',
			identity: sourceSetIdentity(sources),
			sha256: sourceSetHash(sources),
			schemaFingerprints: [],
			tables: [
				mapJsonListTable(
					'archive_list',
					'archives_id',
					this.documents.archiveList,
					true,
					archiveReadModelFields.list,
				),
				mapJsonMapTable(
					'archive_detail',
					'archives_id',
					this.documents.archiveDetails,
					archiveReadModelFields.detail,
				),
				mapJsonListTable(
					'with_station_list',
					'live_id',
					this.documents.withStationList,
					true,
					archiveReadModelFields.stationList,
				),
				mapJsonMapTable(
					'with_station_detail',
					'live_id',
					this.documents.withStationDetails,
					archiveReadModelFields.stationDetail,
					withStationDetailResponseOnlyFields,
				),
				...(this.documents.extension?.tables ?? []),
				filterableCharacterTable(this.documents.filterableCharacters),
				archiveSortableFieldTable(),
			],
		};
	}
}

const archiveSortableFields = [
	{ key: 'live_start_time', label: '日付順' },
	{ key: 'star_count', label: 'With Starの数' },
] as const;
const archiveSortableFieldsDocument: SavedJsonDocument = {
	identity: 'archive-sortable-fields-v1',
	sha256: createHash('sha256')
		.update(JSON.stringify(archiveSortableFields))
		.digest('hex'),
	value: archiveSortableFields,
};

const withStationDetailResponseOnlyFields = new Set(['bgmAcbPath']);

function filterableCharacterTable(
	characters: readonly ArchiveFilterableCharacter[],
): ActiveDatabaseTable {
	return {
		name: 'archive_filterable_character',
		columns: [
			{ name: 'character_id', type: 'INTEGER', nullable: false },
			{ name: 'label', type: 'TEXT', nullable: false },
			{ name: 'order_id', type: 'INTEGER', nullable: false },
		],
		primaryKey: ['character_id'],
		indexes: [
			{
				name: 'idx_archive_filterable_character_order',
				columns: ['order_id'],
				unique: false,
			},
		],
		rows: characters.map((character) => ({
			character_id: character.characterId,
			label: character.label,
			order_id: character.orderId,
		})),
	};
}

function archiveSortableFieldTable(): ActiveDatabaseTable {
	return {
		name: 'archive_sortable_field',
		columns: [
			{ name: 'key', type: 'TEXT', nullable: false },
			{ name: 'label', type: 'TEXT', nullable: false },
			{ name: 'order_id', type: 'INTEGER', nullable: false },
		],
		primaryKey: ['key'],
		indexes: [
			{
				name: 'idx_archive_sortable_field_order',
				columns: ['order_id'],
				unique: false,
			},
		],
		rows: archiveSortableFields.map((field, orderId) => ({
			...field,
			order_id: orderId,
		})),
	};
}

function mapJsonListTable(
	tableName: string,
	idField: string,
	document: SavedJsonDocument,
	rowIndex: boolean,
	fieldTypes: Readonly<Record<string, 'INTEGER' | 'TEXT'>>,
): ActiveDatabaseTable {
	if (!Array.isArray(document.value)) {
		throw new Error(`${document.identity} must contain a list`);
	}
	const records = document.value.map((value) => {
		const record = requireRecord(value, document.identity);
		return {
			identity: requireString(record[idField], `${tableName}.${idField}`),
			record,
		};
	});
	return mapJsonRecords(tableName, idField, records, rowIndex, fieldTypes);
}

function mapJsonMapTable(
	tableName: string,
	idField: string,
	document: SavedJsonDocument,
	fieldTypes: Readonly<Record<string, 'INTEGER' | 'TEXT'>> = {},
	responseOnlyFields: ReadonlySet<string> = new Set(),
): ActiveDatabaseTable {
	const map = requireRecord(document.value, document.identity);
	const records = Object.entries(map).map(([identity, value]) => ({
		identity,
		record: requireRecord(value, document.identity),
	}));
	return mapJsonRecords(
		tableName,
		idField,
		records,
		false,
		fieldTypes,
		responseOnlyFields,
	);
}

function mapJsonRecords(
	tableName: string,
	idField: string,
	records: readonly Readonly<{
		identity: string;
		record: Readonly<Record<string, unknown>>;
	}>[],
	rowIndex: boolean,
	declaredFieldTypes: Readonly<Record<string, 'INTEGER' | 'TEXT'>> = {},
	responseOnlyFields: ReadonlySet<string> = new Set(),
): ActiveDatabaseTable {
	const fields = [
		...new Set([
			...Object.keys(declaredFieldTypes),
			...records.flatMap(({ record }) => Object.keys(record)),
		]),
	]
		.filter((field) => field !== idField && !responseOnlyFields.has(field))
		.sort();
	const fieldValues = new Map(
		fields.map((field) => [field, records.map(({ record }) => record[field])]),
	);
	const fieldTypes = new Map(
		fields.map((field) => {
			const values = fieldValues.get(field);
			if (values === undefined)
				throw new Error('Archive field values are absent');
			return [
				field,
				declaredFieldTypes[field] ?? inferJsonColumnType(values),
			] as const;
		}),
	);
	const columns: ActiveDatabaseColumn[] = [
		{ name: idField, type: 'TEXT', nullable: false },
		{ name: 'response_json', type: 'TEXT', nullable: false },
	];
	if (rowIndex) {
		columns.push({ name: 'row_index', type: 'INTEGER', nullable: false });
	}
	for (const field of fields) {
		const type = fieldTypes.get(field);
		if (type === undefined) throw new Error('Archive field type is absent');
		const values = fieldValues.get(field);
		if (values === undefined)
			throw new Error('Archive field values are absent');
		columns.push({
			name: field,
			type,
			nullable: values.some((value) => value === undefined || value === null),
		});
	}
	return {
		name: tableName,
		columns,
		primaryKey: [idField],
		indexes: [
			{
				name: `idx_${tableName}_${idField}`,
				columns: [idField],
				unique: false,
			},
			...(rowIndex
				? [
						{
							name: `idx_${tableName}_row_index`,
							columns: ['row_index'],
							unique: false,
						},
					]
				: []),
		],
		rows: records.map(({ identity, record }, index) => {
			const row: Record<string, ActiveDatabaseValue> = {
				[idField]: identity,
				response_json: JSON.stringify(record),
			};
			if (rowIndex) row.row_index = index;
			for (const field of fields) {
				const type = fieldTypes.get(field);
				if (type === undefined) throw new Error('Archive field type is absent');
				row[field] = jsonDatabaseValue(record[field]);
			}
			return row;
		}),
	};
}

function inferJsonColumnType(values: readonly unknown[]): 'INTEGER' | 'TEXT' {
	const present = values.filter(
		(value) => value !== undefined && value !== null,
	);
	if (present.length === 0) throw new Error('Cannot infer an empty JSON field');
	if (
		present.every(
			(value) => typeof value === 'number' || typeof value === 'boolean',
		)
	) {
		return 'INTEGER';
	}
	if (
		present.every(
			(value) => typeof value === 'string' || typeof value === 'object',
		)
	) {
		return 'TEXT';
	}
	throw new Error('Saved JSON field contains mixed database types');
}

function jsonDatabaseValue(value: unknown): string | number | null {
	if (value === undefined || value === null) return null;
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (typeof value === 'number' || typeof value === 'string') return value;
	return JSON.stringify(value);
}

import { createHash } from 'node:crypto';
