import { createHash } from 'node:crypto';
import { z } from 'zod';
import { completeResourceVersionSchema } from './resource-version.ts';

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);

const catalogSourceSchema = z
	.object({
		identitySha256: sha256Schema,
		sourceSha256: sha256Schema,
	})
	.strict();

const masterTableManifestSchema = z
	.object({
		label: z.string().min(1),
		catalogResourceIdentity: z.string().min(1),
		encryptedResourceSha256: sha256Schema,
		blobSha256: sha256Schema,
		schemaFingerprint: sha256Schema,
		rowCount: z.number().int().nonnegative(),
		status: z.literal('verified'),
	})
	.strict();

export const platformManifestSchema = z
	.object({
		schemaVersion: z.literal(1),
		platform: z.enum(['android', 'ios']),
		clientVersion: z.string().min(1),
		resourceVersion: completeResourceVersionSchema,
		catalog: catalogSourceSchema,
		tables: z.array(masterTableManifestSchema),
	})
	.strict()
	.superRefine((manifest, context) => {
		const labels = new Set<string>();
		const catalogResourceIdentities = new Set<string>();
		for (const [index, table] of manifest.tables.entries()) {
			if (labels.has(table.label)) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					message: `duplicate master table label: ${table.label}`,
					path: ['tables', index, 'label'],
				});
			}
			labels.add(table.label);
			if (catalogResourceIdentities.has(table.catalogResourceIdentity)) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					message: `duplicate catalog resource identity: ${table.catalogResourceIdentity}`,
					path: ['tables', index, 'catalogResourceIdentity'],
				});
			}
			catalogResourceIdentities.add(table.catalogResourceIdentity);
		}
	});

export type PlatformManifest = z.infer<typeof platformManifestSchema>;

export function parsePlatformManifest(value: unknown): PlatformManifest {
	return platformManifestSchema.parse(value);
}

export function platformManifestIdentity(manifest: PlatformManifest): string {
	const canonicalTables = [...manifest.tables].sort((left, right) =>
		left.label.localeCompare(right.label),
	);
	return createHash('sha256')
		.update(JSON.stringify({ ...manifest, tables: canonicalTables }))
		.digest('hex');
}
