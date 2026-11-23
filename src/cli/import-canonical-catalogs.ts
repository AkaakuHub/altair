import { z } from 'zod';
import { importCanonicalCatalogs } from '../canonical-catalog-import/infrastructure/node-canonical-catalog-import.ts';
import { resolveRuntimeStorageLayout } from '../configuration/runtime-storage-layout.ts';

const [platform, sourceRoot, ...extra] = Bun.argv.slice(2);
if (platform === undefined || sourceRoot === undefined || extra.length !== 0)
	throw new Error(
		'Usage: catalog:import-canonical <android|ios> <source-root>',
	);
const { catalogRoot } = resolveRuntimeStorageLayout();
const result = await importCanonicalCatalogs({
	platform: z.enum(['android', 'ios']).parse(platform),
	sourceRoot,
	canonicalRoot: catalogRoot,
	databaseRoot: catalogRoot,
});
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
