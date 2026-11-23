import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { MasterResourceCatalogEntry } from './master-resource-import.ts';
import { completeResourceVersionSchema } from './resource-version.ts';

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);

const catalogMasterManifestSchema = z
	.object({
		schemaVersion: z.literal(1),
		platform: z.enum(['android', 'ios']),
		clientVersion: z.string().min(1),
		resourceVersion: completeResourceVersionSchema,
		catalog: z
			.object({
				identitySha256: sha256Schema,
				sourceSha256: sha256Schema,
			})
			.strict(),
		tables: z.array(
			z
				.object({
					label: z.string().min(1),
					catalogResourceIdentity: sha256Schema,
					assetPath: z.string().min(1),
					encryptedSize: z.number().int().nonnegative(),
					catalogChecksum: z.string().regex(/^\d+$/u),
					encryptionSalt: z.string().regex(/^\d+$/u),
				})
				.strict(),
		),
	})
	.strict()
	.superRefine((manifest, context) => {
		const labels = new Set<string>();
		for (const [index, table] of manifest.tables.entries()) {
			if (labels.has(table.label)) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					message: `duplicate master table label: ${table.label}`,
					path: ['tables', index, 'label'],
				});
			}
			labels.add(table.label);
		}
	});

export function parseCatalogMasterManifest(value: unknown) {
	return catalogMasterManifestSchema.parse(value);
}

export function createCatalogMasterManifest(input: {
	clientVersion: string;
	resourceVersion: string;
	catalogIdentitySha256: string;
	catalogSourceSha256: string;
	entries: readonly MasterResourceCatalogEntry[];
}) {
	const platform = input.entries[0]?.platform;
	if (platform === undefined) throw new Error('Master catalog is empty');
	for (const entry of input.entries) {
		if (
			entry.platform !== platform ||
			entry.resourceVersion !== input.resourceVersion
		) {
			throw new Error('Master catalog entry profile differs');
		}
	}
	return catalogMasterManifestSchema.parse({
		schemaVersion: 1,
		platform,
		clientVersion: input.clientVersion,
		resourceVersion: input.resourceVersion,
		catalog: {
			identitySha256: input.catalogIdentitySha256,
			sourceSha256: input.catalogSourceSha256,
		},
		tables: input.entries.map((entry) => ({
			label: entry.tableLabel,
			catalogResourceIdentity: entry.catalogResourceIdentity,
			assetPath: entry.assetPath,
			encryptedSize: entry.encryptedSize,
			catalogChecksum: entry.catalogChecksum,
			encryptionSalt: entry.encryptionSalt,
		})),
	});
}

export function catalogIdentity(input: {
	platform: 'android' | 'ios';
	clientVersion: string;
	resourceVersion: string;
	sourceSha256: string;
}): string {
	return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}
