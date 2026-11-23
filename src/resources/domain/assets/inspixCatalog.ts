import { z } from 'zod';
import type { BinaryCatalogEntry } from './catalogBinary.ts';

const stringsSchema = z.preprocess((value) => value ?? [], z.array(z.string()));

const entrySchema = z.object({
	Priority: z.number().int().nonnegative(),
	ResourceType: z.number().int().nonnegative(),
	Size: z.number().int().nonnegative(),
	StrTypeCrc: z.string().min(1),
	StrContentTypeCrcs: stringsSchema,
	StrCategoryCrcs: stringsSchema,
	StrLabelCrc: z.string().min(1),
	StrContentNameCrcs: stringsSchema,
	StrDepCrcs: stringsSchema,
	Checksum: z.union([
		z.string().regex(/^\d+$/),
		z.number().int().nonnegative(),
	]),
	Seed: z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]),
});

export function parseInspixCatalogJson(json: string): BinaryCatalogEntry[] {
	const safeJson = json
		.replace(/("Checksum"\s*:\s*)(\d+)/g, '$1"$2"')
		.replace(/("Seed"\s*:\s*)(\d+)/g, '$1"$2"');
	const input: unknown = JSON.parse(safeJson);
	return z
		.array(entrySchema)
		.parse(input)
		.map((entry) => {
			if (entry.StrContentTypeCrcs.length !== entry.StrContentNameCrcs.length) {
				throw new Error(`Catalog content arrays differ: ${entry.StrLabelCrc}`);
			}
			return {
				priority: entry.Priority,
				resourceType: entry.ResourceType,
				size: entry.Size,
				type: entry.StrTypeCrc,
				contents: entry.StrContentNameCrcs.map((label, index) => ({
					label,
					type: required(entry.StrContentTypeCrcs[index]),
				})),
				categories: entry.StrCategoryCrcs,
				label: entry.StrLabelCrc,
				dependencies: entry.StrDepCrcs,
				checksum: BigInt(entry.Checksum),
				encryptionSalt: BigInt(entry.Seed),
			};
		});
}

function required<Value>(value: Value | undefined): Value {
	if (value === undefined) throw new Error('Catalog content type is missing');
	return value;
}
