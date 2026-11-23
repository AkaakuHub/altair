import { z } from 'zod';
import { assetCatalogEntrySchema } from './assetCatalog.ts';

export const catalogPlatformRootSchema = z
	.object({
		platform: z.enum(['android', 'ios']),
		entry: assetCatalogEntrySchema,
	})
	.strict();

export type CatalogPlatformRoot = z.infer<typeof catalogPlatformRootSchema>;
