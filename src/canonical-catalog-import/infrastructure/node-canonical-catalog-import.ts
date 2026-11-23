import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { parseInspixCatalogJson } from '../../resources/domain/assets/inspixCatalog.ts';
import { readSqliteCatalog } from '../../resources/infrastructure/catalog/sqliteCatalogReader.ts';
import { createSqliteCatalog } from '../../resources/infrastructure/catalog/sqliteCatalogWriter.ts';
import {
	CanonicalCatalogImportService,
	type CanonicalCatalogImportStorage,
	type CatalogImportArtifact,
	CatalogImportError,
} from '../application/canonical-catalog-import-service.ts';
import type {
	CatalogImportIdentity,
	CatalogPlatform,
} from '../domain/catalog-import-identity.ts';
import { storeImmutableFile } from './node-immutable-file-store.ts';

const iosMetadataSchema = z
	.object({
		clientVersion: z.string(),
		platform: z.string(),
		catalogVersion: z.string(),
		allSpec: z.string(),
	})
	.strict();

export async function importCanonicalCatalogs(input: {
	platform: CatalogPlatform;
	sourceRoot: string;
	canonicalRoot: string;
	databaseRoot: string;
}) {
	return new CanonicalCatalogImportService(
		new NodeCanonicalCatalogImportStorage(),
	).import(input);
}

class NodeCanonicalCatalogImportStorage
	implements CanonicalCatalogImportStorage
{
	async listSourceFiles(
		platform: CatalogPlatform,
		sourceRoot: string,
	): Promise<string[]> {
		const suffix =
			platform === 'android' ? '__cache__catalog.json.gz' : '.sqlite3';
		return (await listFilesRecursively(sourceRoot))
			.filter((path) => basename(path).endsWith(suffix))
			.sort();
	}

	async readAndValidateSource(
		identity: CatalogImportIdentity,
		sourcePath: string,
	): Promise<CatalogImportArtifact> {
		const bytes = await readFile(sourcePath);
		let databaseBytes: Uint8Array;
		try {
			if (identity.platform === 'android') {
				databaseBytes = createSqliteCatalog(
					parseInspixCatalogJson(gunzipSync(bytes).toString('utf8')),
					{
						clientVersion: identity.clientVersion,
						platform: identity.platform,
						resourceVersion: identity.resourceVersion,
					},
				);
			} else {
				const entries = readSqliteCatalog(sourcePath);
				validateIosMetadata(sourcePath, identity);
				databaseBytes = createSqliteCatalog(entries, {
					clientVersion: identity.clientVersion,
					platform: identity.platform,
					resourceVersion: identity.resourceVersion,
				});
			}
		} catch (error) {
			if (error instanceof CatalogImportError) {
				throw error;
			}
			throw new CatalogImportError(
				'catalog-source-invalid',
				errorMessage(error),
			);
		}
		return {
			identity,
			sourcePath,
			bytes,
			sha256: createHash('sha256').update(bytes).digest('hex'),
			databaseBytes,
		};
	}

	async store(
		artifact: CatalogImportArtifact,
		destinationPath: string,
		databaseDestinationPath: string,
	): Promise<'copied' | 'existing'> {
		const sourceStatus = await storeImmutableFile(
			destinationPath,
			artifact.bytes,
			catalogDestinationConflict,
		);
		if (databaseDestinationPath !== destinationPath)
			await storeImmutableFile(
				databaseDestinationPath,
				artifact.databaseBytes,
				catalogDestinationConflict,
			);
		return sourceStatus;
	}
}

async function listFilesRecursively(root: string): Promise<string[]> {
	const entries = await readdir(root, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await listFilesRecursively(path)));
		} else if (entry.isFile()) {
			files.push(path);
		}
	}
	return files;
}

function validateIosMetadata(
	path: string,
	identity: CatalogImportIdentity,
): void {
	const database = new Database(path, { readonly: true, strict: true });
	try {
		let row: unknown;
		try {
			row = database
				.query(
					`SELECT app_version AS clientVersion, platform,
					 catalog_version AS catalogVersion, all_spec AS allSpec
					 FROM metadata`,
				)
				.get();
		} catch (error) {
			throw new CatalogImportError(
				'catalog-metadata-missing',
				errorMessage(error),
			);
		}
		if (row === null) {
			throw new CatalogImportError(
				'catalog-metadata-missing',
				'iOS catalog metadata row is absent',
			);
		}
		const metadata = iosMetadataSchema.parse(row);
		if (
			metadata.clientVersion !== identity.clientVersion ||
			metadata.platform.toLowerCase() !== 'ios' ||
			`${metadata.catalogVersion}@${metadata.allSpec}` !==
				identity.resourceVersion
		) {
			throw new CatalogImportError(
				'catalog-metadata-mismatch',
				'iOS catalog metadata differs from source filename identity',
			);
		}
	} finally {
		database.close();
	}
}

function catalogDestinationConflict(): CatalogImportError {
	return new CatalogImportError(
		'catalog-destination-conflict',
		'Canonical catalog destination bytes differ',
	);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
