import { describe, expect, test } from 'bun:test';
import {
	DescriptorMasterFieldNameRegistry,
	schemaFieldSourcesIdentity,
} from '../src/master-archive/domain/schema-field-name-registry.ts';

function field(officialFieldName: string) {
	return {
		crc: 0xdbac3d2a,
		officialFieldName,
		typeCode: 0x20,
	} as const;
}

describe('descriptor master field name registry', () => {
	test('resolves by table, CRC, and observed binary type', () => {
		const registry = new DescriptorMasterFieldNameRegistry([
			{
				tableLabel: 'carddatas.tsv',
				fields: [field('Id')],
			},
		]);

		expect(
			registry.resolve({
				tableLabel: 'carddatas.tsv',
				fieldCrc: 0xdbac3d2a,
				typeCode: 0x20,
			}),
		).toBe('Id');
		expect(
			registry.resolve({
				tableLabel: 'carddatas.tsv',
				fieldCrc: 0xdbac3d2a,
				typeCode: 0x33,
			}),
		).toBeNull();
		expect(
			registry.resolveFieldCrcs({
				tableLabel: 'carddatas.tsv',
				officialFieldName: 'Id',
				typeCode: 0x20,
			}),
		).toEqual([0xdbac3d2a]);
		expect(
			registry.resolveFieldCrcs({
				tableLabel: 'carddatas.tsv',
				officialFieldName: 'Id',
				typeCode: 0x33,
			}),
		).toEqual([]);
	});

	test('rejects conflicting official names for the same field identity', () => {
		expect(
			() =>
				new DescriptorMasterFieldNameRegistry([
					{
						tableLabel: 'carddatas.tsv',
						fields: [field('Id'), field('OtherId')],
					},
				]),
		).toThrow('Schema field name conflict');
	});

	test('retains platform-specific CRCs for the same table, name, and binary type', () => {
		const registry = new DescriptorMasterFieldNameRegistry([
			{
				tableLabel: 'carddatas.tsv',
				fields: [field('Id'), { ...field('Id'), crc: 0x004d3385 }],
			},
		]);
		expect(
			registry.resolveFieldCrcs({
				tableLabel: 'carddatas.tsv',
				officialFieldName: 'Id',
				typeCode: 0x20,
			}),
		).toEqual([0x004d3385, 0xdbac3d2a]);
	});

	test('creates an order-independent identity for the field mappings', () => {
		const first = {
			tableLabel: 'carddatas.tsv',
			fields: [field('Id')],
		};
		const second = {
			tableLabel: 'items.tsv',
			fields: [
				{
					...field('Id'),
					crc: 0x8c5c7225,
				},
			],
		};

		expect(schemaFieldSourcesIdentity([first, second])).toBe(
			schemaFieldSourcesIdentity([second, first]),
		);
		expect(schemaFieldSourcesIdentity([first])).not.toBe(
			schemaFieldSourcesIdentity([second]),
		);
		expect(
			schemaFieldSourcesIdentity([
				first,
				{ ...first, fields: [{ ...field('Name'), crc: 0x004d3385 }] },
			]),
		).toBe(
			schemaFieldSourcesIdentity([
				{ ...first, fields: [{ ...field('Name'), crc: 0x004d3385 }] },
				first,
			]),
		);
	});

	test('changes the identity when a field name or type code changes', () => {
		const source = { tableLabel: 'carddatas.tsv', fields: [field('Id')] };
		expect(schemaFieldSourcesIdentity([source])).not.toBe(
			schemaFieldSourcesIdentity([{ ...source, fields: [field('Name')] }]),
		);
		expect(schemaFieldSourcesIdentity([source])).not.toBe(
			schemaFieldSourcesIdentity([
				{ ...source, fields: [{ ...field('Id'), typeCode: 0x33 }] },
			]),
		);
	});

	test('does not resolve an unnamed field in either direction', () => {
		const registry = new DescriptorMasterFieldNameRegistry([
			{
				tableLabel: 'carddatas.tsv',
				fields: [{ ...field('Id'), officialFieldName: null }],
			},
		]);
		expect(
			registry.resolve({
				tableLabel: 'carddatas.tsv',
				fieldCrc: 0xdbac3d2a,
				typeCode: 0x20,
			}),
		).toBeNull();
		expect(
			registry.resolveFieldCrcs({
				tableLabel: 'carddatas.tsv',
				officialFieldName: 'Id',
				typeCode: 0x20,
			}),
		).toEqual([]);
	});
});
