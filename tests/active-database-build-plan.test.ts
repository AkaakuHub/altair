import { describe, expect, test } from 'bun:test';
import {
	type ActiveMasterSourceResult,
	createActiveDatabaseBuildPlan,
} from '../src/master-archive/domain/active-database-build.ts';

const hash = (character: string) => character.repeat(64);

function source(identity: string): ActiveMasterSourceResult {
	return {
		kind: 'official-master',
		identity,
		sha256: hash('a'),
		schemaFingerprints: [hash('b')],
		tables: [
			{
				name: 'master_card_datas',
				columns: [
					{ name: 'id', type: 'INTEGER', nullable: false },
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
				rows: [{ id: 10_104_000, name: 'Dream Believers' }],
			},
		],
	};
}

describe('active database build plan', () => {
	test('is deterministic regardless of source input order', () => {
		const archive: ActiveMasterSourceResult = {
			kind: 'archive',
			identity: 'saved-archive-json',
			sha256: hash('c'),
			schemaFingerprints: [],
			tables: [],
		};
		const official = source('android-ios-release');
		const first = createActiveDatabaseBuildPlan({
			releaseIdentity: hash('d'),
			builderIdentity: 'active-db-builder-v1',
			sources: [official, archive],
		});
		const second = createActiveDatabaseBuildPlan({
			releaseIdentity: hash('d'),
			builderIdentity: 'active-db-builder-v1',
			sources: [archive, official],
		});

		expect(second.logicalDatabaseIdentity).toBe(first.logicalDatabaseIdentity);
		expect(second.tables).toEqual(first.tables);
	});

	test('rejects schema and row definitions that cannot be written exactly', () => {
		const invalid = source('invalid');
		const invalidTable = invalid.tables[0];
		if (invalidTable === undefined) throw new Error('fixture table is missing');

		expect(() =>
			createActiveDatabaseBuildPlan({
				releaseIdentity: hash('d'),
				builderIdentity: 'active-db-builder-v1',
				sources: [
					{
						...invalid,
						tables: [
							{
								...invalidTable,
								rows: [{ id: 10_104_000 }],
							},
						],
					},
				],
			}),
		).toThrow('Missing master_card_datas.name in row 0');
	});

	test('rejects two sources that would overwrite the same table', () => {
		expect(() =>
			createActiveDatabaseBuildPlan({
				releaseIdentity: hash('d'),
				builderIdentity: 'active-db-builder-v1',
				sources: [source('android'), source('ios')],
			}),
		).toThrow('Duplicate active database table: master_card_datas');
	});

	test('allows only the defined internal row index column identifier', () => {
		const official = source('internal-row-index');
		const table = official.tables[0];
		if (table === undefined) throw new Error('fixture table is missing');
		const withInternalColumn = (name: string): ActiveMasterSourceResult => ({
			...official,
			tables: [
				{
					...table,
					columns: [
						...table.columns,
						{ name, type: 'INTEGER', nullable: false },
					],
					rows: [{ ...table.rows[0], [name]: 0 }],
				},
			],
		});

		expect(() =>
			createActiveDatabaseBuildPlan({
				releaseIdentity: hash('d'),
				builderIdentity: 'active-db-builder-v1',
				sources: [withInternalColumn('__row_index')],
			}),
		).not.toThrow();
		expect(() =>
			createActiveDatabaseBuildPlan({
				releaseIdentity: hash('d'),
				builderIdentity: 'active-db-builder-v1',
				sources: [withInternalColumn('__unexpected')],
			}),
		).toThrow('Invalid active database column identifier: __unexpected');
	});

	test('rejects integers outside the exact SQLite signed 64-bit range', () => {
		const invalid = source('invalid-int64');
		const table = invalid.tables[0];
		if (table === undefined) throw new Error('fixture table is missing');
		expect(() =>
			createActiveDatabaseBuildPlan({
				releaseIdentity: hash('d'),
				builderIdentity: 'active-db-builder-v1',
				sources: [
					{
						...invalid,
						tables: [
							{
								...table,
								rows: [
									{
										id: 9_223_372_036_854_775_808n,
										name: 'outside SQLite range',
									},
								],
							},
						],
					},
				],
			}),
		).toThrow('SQLite integer is out of signed 64-bit range');
	});
});
