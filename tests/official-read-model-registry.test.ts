import { describe, expect, test } from 'bun:test';
import { DescriptorMasterFieldNameRegistry } from '../src/master-archive/domain/schema-field-name-registry.ts';
import { validateOfficialReadModelDefinitions } from '../src/master-archive/infrastructure/source-adapters/official-read-model-registry.ts';
import type { OfficialReadModelDefinition } from '../src/master-archive/infrastructure/source-adapters/source-input.ts';

const definition: OfficialReadModelDefinition = {
	tableLabel: 'carddatas.tsv',
	databaseTableName: 'master_card_datas',
	columns: [
		{
			source: 'field',
			fieldCrc: 0xdbac3d2a,
			columnName: 'id',
			type: 'INTEGER',
			binaryTypeCode: 0x20,
		},
		{
			source: 'field',
			fieldCrc: 0x004d3385,
			columnName: 'name',
			type: 'TEXT',
			binaryTypeCode: 0x10,
		},
	],
	primaryKey: ['id'],
	indexes: [
		{
			name: 'idx_master_card_datas_name',
			columns: ['name'],
			unique: false,
		},
	],
};

const fieldNames = new DescriptorMasterFieldNameRegistry([
	{
		tableLabel: 'carddatas.tsv',
		fields: [
			{
				crc: 0xdbac3d2a,
				officialFieldName: 'Id',
				typeCode: 0x20,
			},
			{
				crc: 0x004d3385,
				officialFieldName: 'Name',
				typeCode: 0x10,
			},
			{
				crc: 0x33333333,
				officialFieldName: 'LongId',
				typeCode: 0x33,
			},
		],
	},
]);

describe('official read model registry', () => {
	test('accepts a definition whose keys and indexes reference exact columns', () => {
		expect(
			validateOfficialReadModelDefinitions([definition], fieldNames),
		).toEqual([definition]);
	});

	test('rejects duplicate table labels instead of selecting one implicitly', () => {
		expect(() =>
			validateOfficialReadModelDefinitions(
				[
					definition,
					{ ...definition, databaseTableName: 'master_other_card_datas' },
				],
				fieldNames,
			),
		).toThrow('Duplicate official master table label: carddatas.tsv');
	});

	test('rejects primary keys and indexes that reference absent columns', () => {
		expect(() =>
			validateOfficialReadModelDefinitions(
				[{ ...definition, primaryKey: ['missing'] }],
				fieldNames,
			),
		).toThrow('Unknown official read model primary key column');
		expect(() =>
			validateOfficialReadModelDefinitions(
				[
					{
						...definition,
						indexes: [
							{
								name: 'idx_master_card_datas_missing',
								columns: ['missing'],
								unique: false,
							},
						],
					},
				],
				fieldNames,
			),
		).toThrow('Unknown official read model index column');
	});

	test('rejects CRC, type, and column names that differ from the schema', () => {
		expect(() =>
			validateOfficialReadModelDefinitions(
				[
					{
						...definition,
						columns: [
							{
								source: 'field',
								fieldCrc: 1,
								columnName: 'id',
								type: 'INTEGER',
								binaryTypeCode: 0x20,
							},
						],
						primaryKey: ['id'],
						indexes: [],
					},
				],
				fieldNames,
			),
		).toThrow('Official read model field has no matching schema field');
		expect(() =>
			validateOfficialReadModelDefinitions(
				[
					{
						...definition,
						columns: [
							{
								source: 'field',
								fieldCrc: 0xdbac3d2a,
								columnName: 'identifier',
								type: 'INTEGER',
								binaryTypeCode: 0x20,
							},
						],
						primaryKey: [],
						indexes: [],
					},
				],
				fieldNames,
			),
		).toThrow(
			'Official read model column differs from the official field name',
		);
	});

	test('distinguishes int64 fields from int32 SQLite integers', () => {
		expect(
			validateOfficialReadModelDefinitions(
				[
					{
						...definition,
						columns: [
							{
								source: 'field',
								fieldCrc: 0x33333333,
								columnName: 'long_id',
								type: 'INTEGER',
								binaryTypeCode: 0x33,
							},
						],
						primaryKey: [],
						indexes: [],
					},
				],
				fieldNames,
			),
		).toHaveLength(1);
		expect(() =>
			validateOfficialReadModelDefinitions(
				[
					{
						...definition,
						columns: [
							{
								source: 'field',
								fieldCrc: 0x33333333,
								columnName: 'long_id',
								type: 'INTEGER',
								binaryTypeCode: 0x20,
							},
						],
						primaryKey: [],
						indexes: [],
					},
				],
				fieldNames,
			),
		).toThrow('Official read model field has no matching schema field');
	});
});
