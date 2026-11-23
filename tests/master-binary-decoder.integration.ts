import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import {
	decodeGenericMasterBinary,
	genericMasterInt32CellFromSignedValue,
	MasterBinaryDecodeError,
} from '../src/master-archive/domain/generic-master-binary.ts';
import { savedMasterFixturePath } from './masterArchive/fixtures/savedMasterFixtures.ts';

const fixtureRoot = new URL('./fixtures/master-binary/', import.meta.url);
const fieldNames = new Map<number, string>([
	[0xdbac3d2a, 'Id'],
	[0x004d3305, 'Name'],
	[0xca21ca53, 'IsParallelCard'],
]);

async function decodeFixture(name: string) {
	return decodeBytes(await Bun.file(new URL(name, fixtureRoot)).bytes());
}

async function decodeSavedFixture(name: string) {
	return decodeBytes(await Bun.file(savedMasterFixturePath(name)).bytes());
}

function decodeBytes(bytes: Uint8Array) {
	return decodeGenericMasterBinary(
		'carddatas.tsv',
		bytes,
		({ fieldCrc }) => fieldNames.get(fieldCrc) ?? null,
	);
}

describe('generic master binary decoder fixtures', () => {
	test('encodes signed int32 values with the decoder uint64 varint rule', () => {
		expect(genericMasterInt32CellFromSignedValue(7)).toEqual({
			kind: 'int32',
			value: 7,
			encodedUnsigned: '7',
		});
		expect(genericMasterInt32CellFromSignedValue(-1)).toEqual({
			kind: 'int32',
			value: -1,
			encodedUnsigned: '18446744073709551615',
		});
	});

	test('matches every official fixture to its machine-readable provenance', async () => {
		const provenance: unknown = await Bun.file(
			new URL('provenance.json', fixtureRoot),
		).json();
		if (!isFixtureProvenance(provenance)) {
			throw new Error('Master fixture provenance is invalid');
		}
		for (const fixture of provenance.officialFixtures) {
			const bytes = await Bun.file(
				savedMasterFixturePath(fixture.fixture),
			).bytes();
			const decoded = await decodeSavedFixture(fixture.fixture);
			expect(createHash('sha256').update(bytes).digest('hex')).toBe(
				fixture.sha256,
			);
			expect(decoded.table.rowCount).toBe(fixture.rowCount);
			expect(decoded.table.fieldCount).toBe(fixture.fieldCount);
			expect(
				decoded.table.fields.some((field) => field.crc === 0xca21ca53),
			).toBe(fixture.isParallelCardCrcPresent);
		}
	});

	test('decodes official CardDatas generations without a fixed struct', async () => {
		const beforeR2604100 = await decodeSavedFixture('carddatas-r2603250.tsv');
		const r2604100 = await decodeSavedFixture('carddatas-r2604100.tsv');
		const r2606002 = await decodeSavedFixture('carddatas-r2606002.tsv');

		expect(beforeR2604100.table.rowCount).toBe(2_566);
		expect(r2604100.table.rowCount).toBe(2_628);
		expect(r2606002.table.rowCount).toBe(2_695);
		expect(beforeR2604100.table.fieldCount).toBe(30);
		expect(r2604100.table.fieldCount).toBe(31);
		expect(r2606002.table.fieldCount).toBe(31);
		expect(
			beforeR2604100.table.fields.some((field) => field.crc === 0xca21ca53),
		).toBe(false);
		expect(r2604100.table.fields.at(-1)).toMatchObject({
			crc: 0xca21ca53,
			officialFieldName: 'IsParallelCard',
			typeCode: 0x20,
		});
		expect(r2606002.table.rows[0]?.cells[0]).toEqual({
			kind: 'int32',
			value: 10_104_000,
			encodedUnsigned: '10104000',
		});
		expect(r2606002.table.rows.at(-1)?.cells.length).toBe(31);
		expect(r2606002.report.consumedByteLength).toBe(r2606002.report.byteLength);
	});

	test('represents field addition and removal as distinct descriptors', async () => {
		const added = await decodeFixture('field-added.tsv');
		const removed = await decodeFixture('field-removed.tsv');

		expect(added.table.fields.map((field) => field.officialFieldName)).toEqual([
			'Id',
			'Name',
			'IsParallelCard',
		]);
		expect(
			removed.table.fields.map((field) => field.officialFieldName),
		).toEqual(['Id']);
		expect(added.table.rows[1]?.cells[2]).toEqual({
			kind: 'int32',
			value: 1,
			encodedUnsigned: '1',
		});
	});

	test('decodes a zero-row table while retaining its schema', async () => {
		const decoded = await decodeFixture('zero-rows.tsv');

		expect(decoded.table.rowCount).toBe(0);
		expect(decoded.table.fields).toHaveLength(1);
		expect(decoded.table.rows).toEqual([]);
	});

	test('retains unknown field CRC descriptors, reports them, and keeps cells', async () => {
		const decoded = await decodeFixture('unknown-field-crc.tsv');

		expect(decoded.table.fields[1]).toMatchObject({
			crc: 0xdeadbeef,
			officialFieldName: null,
			typeName: 'string',
		});
		expect(decoded.report.unknownFieldCrcs).toEqual([0xdeadbeef]);
		expect(decoded.table.rows[0]?.cells[1]).toEqual({
			kind: 'string',
			value: 'kept',
		});
	});

	test('decodes a field type change without coercing to the latest type', async () => {
		const decoded = await decodeFixture('field-type-changed.tsv');

		expect(decoded.table.fields[0]).toMatchObject({
			typeCode: 0x33,
			typeName: 'int64',
		});
		expect(decoded.table.rows.map((row) => row.cells[0])).toEqual([
			{ kind: 'int64', value: '-1' },
			{ kind: 'int64', value: '4294967296' },
		]);
	});

	test('returns a machine-readable failure for a truncated binary', async () => {
		try {
			await decodeFixture('corrupt.tsv');
			throw new Error('expected decode failure');
		} catch (error) {
			expect(error).toBeInstanceOf(MasterBinaryDecodeError);
			if (!(error instanceof MasterBinaryDecodeError)) throw error;
			expect(error.report).toMatchObject({
				status: 'failed',
				code: 'truncated-binary',
				tableLabel: 'carddatas.tsv',
			});
		}
	});

	test('retains the descriptor in an unsupported field type failure', async () => {
		const fixture = await Bun.file(
			new URL('field-removed.tsv', fixtureRoot),
		).bytes();
		const unsupported = Uint8Array.from(fixture);
		unsupported[13] = 0x99;

		try {
			decodeGenericMasterBinary('carddatas.tsv', unsupported);
			throw new Error('expected decode failure');
		} catch (error) {
			expect(error).toBeInstanceOf(MasterBinaryDecodeError);
			if (!(error instanceof MasterBinaryDecodeError)) throw error;
			expect(error.report).toMatchObject({
				status: 'failed',
				code: 'unsupported-field-type',
				fields: [{ crc: 0xdbac3d2a, typeCode: 0x99 }],
			});
		}
	});
});

function isFixtureProvenance(value: unknown): value is {
	officialFixtures: Array<{
		fixture: string;
		sha256: string;
		rowCount: number;
		fieldCount: number;
		isParallelCardCrcPresent: boolean;
	}>;
} {
	if (typeof value !== 'object' || value === null) return false;
	if (
		!('officialFixtures' in value) ||
		!Array.isArray(value.officialFixtures)
	) {
		return false;
	}
	return value.officialFixtures.every(
		(fixture) =>
			typeof fixture === 'object' &&
			fixture !== null &&
			'fixture' in fixture &&
			typeof fixture.fixture === 'string' &&
			'sha256' in fixture &&
			typeof fixture.sha256 === 'string' &&
			'rowCount' in fixture &&
			typeof fixture.rowCount === 'number' &&
			'fieldCount' in fixture &&
			typeof fixture.fieldCount === 'number' &&
			'isParallelCardCrcPresent' in fixture &&
			typeof fixture.isParallelCardCrcPresent === 'boolean',
	);
}
