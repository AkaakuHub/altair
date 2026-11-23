import { createHash } from 'node:crypto';
import type { MasterFieldNameRegistry } from './master-resource-import.ts';

export type SchemaFieldSource = Readonly<{
	tableLabel: string;
	fields: readonly Readonly<{
		crc: number;
		officialFieldName: string | null;
		typeCode: number;
	}>[];
}>;

export function schemaFieldSourcesIdentity(
	schemas: readonly SchemaFieldSource[],
): string {
	const canonical = schemas
		.map((schema) => ({
			tableLabel: schema.tableLabel,
			fields: [...schema.fields]
				.sort(compareFields)
				.map(({ crc, typeCode, officialFieldName }) => [
					crc,
					typeCode,
					officialFieldName,
				]),
		}))
		.sort((left, right) =>
			JSON.stringify(left).localeCompare(JSON.stringify(right)),
		);
	return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

export class DescriptorMasterFieldNameRegistry
	implements MasterFieldNameRegistry
{
	private readonly names = new Map<string, string>();
	private readonly crcs = new Map<string, Set<number>>();

	constructor(schemas: readonly SchemaFieldSource[]) {
		for (const schema of schemas) {
			for (const field of schema.fields) {
				if (field.officialFieldName === null) continue;
				const key = fieldKey(schema.tableLabel, field.crc, field.typeCode);
				const current = this.names.get(key);
				if (current !== undefined && current !== field.officialFieldName) {
					throw new Error(
						`Schema field name conflict: ${schema.tableLabel} CRC ${field.crc}`,
					);
				}
				this.names.set(key, field.officialFieldName);
				const reverseKey = reverseFieldKey(
					schema.tableLabel,
					field.officialFieldName,
					field.typeCode,
				);
				const crcs = this.crcs.get(reverseKey) ?? new Set<number>();
				crcs.add(field.crc);
				this.crcs.set(reverseKey, crcs);
			}
		}
	}

	resolve(input: {
		tableLabel: string;
		fieldCrc: number;
		typeCode: number;
	}): string | null {
		return (
			this.names.get(
				fieldKey(input.tableLabel, input.fieldCrc, input.typeCode),
			) ?? null
		);
	}

	resolveFieldCrcs(input: {
		tableLabel: string;
		officialFieldName: string;
		typeCode: number;
	}): readonly number[] {
		return [
			...(this.crcs.get(
				reverseFieldKey(
					input.tableLabel,
					input.officialFieldName,
					input.typeCode,
				),
			) ?? []),
		].sort((left, right) => left - right);
	}
}

function compareFields(
	left: SchemaFieldSource['fields'][number],
	right: SchemaFieldSource['fields'][number],
): number {
	return (
		left.crc - right.crc ||
		left.typeCode - right.typeCode ||
		(left.officialFieldName ?? '').localeCompare(right.officialFieldName ?? '')
	);
}

function fieldKey(
	tableLabel: string,
	fieldCrc: number,
	typeCode: number,
): string {
	return `${tableLabel}\u0000${fieldCrc.toString(16)}\u0000${typeCode.toString(16)}`;
}

function reverseFieldKey(
	tableLabel: string,
	officialFieldName: string,
	typeCode: number,
): string {
	return `${tableLabel}\u0000${officialFieldName}\u0000${typeCode.toString(16)}`;
}
