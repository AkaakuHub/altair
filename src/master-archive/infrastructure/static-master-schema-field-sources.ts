import { z } from 'zod';
import {
	DescriptorMasterFieldNameRegistry,
	type SchemaFieldSource,
	schemaFieldSourcesIdentity,
} from '../domain/schema-field-name-registry.ts';
import masterTableSchemas from './master-table-schemas.json';

const uint32 = z.number().int().min(0).max(0xffff_ffff);
const schema = z.array(
	z.strictObject({
		tableLabel: z.string().min(1),
		fields: z.array(z.tuple([uint32, uint32, z.string().min(1).nullable()])),
	}),
);

export const STATIC_MASTER_SCHEMA_FIELD_SOURCES: readonly SchemaFieldSource[] =
	schema.parse(masterTableSchemas).map(({ tableLabel, fields }) => ({
		tableLabel,
		fields: fields.map(([crc, typeCode, officialFieldName]) => ({
			crc,
			typeCode,
			officialFieldName,
		})),
	}));

export const STATIC_MASTER_FIELD_NAME_REGISTRY =
	new DescriptorMasterFieldNameRegistry(STATIC_MASTER_SCHEMA_FIELD_SOURCES);

export const STATIC_MASTER_SCHEMA_FIELD_IDENTITY = schemaFieldSourcesIdentity(
	STATIC_MASTER_SCHEMA_FIELD_SOURCES,
);
