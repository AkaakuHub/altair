import { z } from 'zod';

const stringArraySchema = z.preprocess(
	(value) => value ?? [],
	z.array(z.string()),
);

export const assetCatalogEntrySchema = z
	.object({
		assetPath: z.string().min(1),
		realName: z.string().min(1).optional(),
		resourceType: z.number().int().nonnegative(),
		priority: z.number().int().nonnegative().optional(),
		checksum: z.union([z.string().min(1), z.number().nonnegative()]),
		encryptionSalt: z
			.union([z.string().min(1), z.number().nonnegative()])
			.optional(),
		size: z.number().int().nonnegative(),
		label: z.string().min(1),
		type: z.string().min(1).optional(),
		extension: z.string().min(1).optional(),
		categories: stringArraySchema,
		contentTypes: stringArraySchema,
		contentNames: stringArraySchema,
		dependencies: stringArraySchema,
	})
	.passthrough()
	.refine(
		(entry) => entry.type !== undefined || entry.extension !== undefined,
		{
			message: 'Asset entry requires type or extension',
		},
	);

export type AssetCatalogEntry = z.infer<typeof assetCatalogEntrySchema>;

export const assetCatalogSchema = z.array(assetCatalogEntrySchema);

const assetCatalogDocumentSchema = z.object({
	uniqueAssetCount: z.number().int().nonnegative(),
	assets: assetCatalogSchema,
});

export function parseAssetCatalog(input: unknown): AssetCatalogEntry[] {
	if (Array.isArray(input)) {
		return assetCatalogSchema.parse(input);
	}
	return assetCatalogDocumentSchema.parse(input).assets;
}

export function parseAssetCatalogJson(json: string): AssetCatalogEntry[] {
	const checksumSafeJson = json
		.replace(/("checksum"\s*:\s*)(\d+)/g, '$1"$2"')
		.replace(/("encryptionSalt"\s*:\s*)(\d+)/g, '$1"$2"');
	const input: unknown = JSON.parse(checksumSafeJson);
	return parseAssetCatalog(input);
}

export function findAssetCatalogEntries<Entry extends AssetCatalogEntry>(
	entries: Entry[],
	query: string,
): Entry[] {
	const normalizedQuery = query.trim().toLocaleLowerCase();
	if (normalizedQuery.length === 0) {
		return entries;
	}

	return entries.filter((entry) => {
		const values = [
			entry.assetPath,
			entry.realName,
			entry.label,
			assetFormat(entry),
			...entry.categories,
			...entry.contentTypes,
			...entry.contentNames,
		].filter((value): value is string => value !== undefined);
		return values.some((value) =>
			value.toLocaleLowerCase().includes(normalizedQuery),
		);
	});
}

export function assetFormat(entry: AssetCatalogEntry): string {
	const format = entry.type ?? entry.extension;
	if (format === undefined) {
		throw new Error(`Asset format is missing: ${entry.assetPath}`);
	}
	return format;
}
