import { basename, join } from 'node:path';
import {
	type CatalogImportIdentity,
	type CatalogPlatform,
	canonicalCatalogDatabaseRelativePath,
	canonicalCatalogRelativePath,
	catalogImportIdentityKey,
	parseCatalogSourceFilename,
} from '../domain/catalog-import-identity.ts';

export type CatalogImportArtifact = Readonly<{
	identity: CatalogImportIdentity;
	sourcePath: string;
	bytes: Uint8Array;
	sha256: string;
	databaseBytes: Uint8Array;
}>;

type CatalogImportErrorCode =
	| 'catalog-source-empty'
	| 'catalog-source-invalid'
	| 'catalog-identity-collision'
	| 'catalog-metadata-missing'
	| 'catalog-metadata-mismatch'
	| 'catalog-destination-conflict'
	| 'catalog-import-io-failed';

export class CatalogImportError extends Error {
	constructor(
		readonly code: CatalogImportErrorCode,
		message: string,
	) {
		super(message);
	}
}

type CatalogImportEntry = Readonly<{
	identity: CatalogImportIdentity | null;
	sourcePath: string;
	destinationPath: string | null;
	sha256: string | null;
	status: 'copied' | 'existing' | 'failed';
	error: Readonly<{ code: CatalogImportErrorCode; message: string }> | null;
}>;

type CanonicalCatalogImportResult = Readonly<{
	formatVersion: 1;
	operation: 'canonical-catalog-import';
	status: 'succeeded' | 'failed';
	platform: CatalogPlatform;
	sourceRoot: string;
	canonicalRoot: string;
	databaseRoot: string;
	counts: Readonly<{ copied: number; existing: number; failed: number }>;
	entries: readonly CatalogImportEntry[];
}>;

export interface CanonicalCatalogImportStorage {
	listSourceFiles(
		platform: CatalogPlatform,
		sourceRoot: string,
	): Promise<string[]>;
	readAndValidateSource(
		identity: CatalogImportIdentity,
		sourcePath: string,
	): Promise<CatalogImportArtifact>;
	store(
		artifact: CatalogImportArtifact,
		destinationPath: string,
		databaseDestinationPath: string,
	): Promise<'copied' | 'existing'>;
}

export class CanonicalCatalogImportService {
	constructor(private readonly storage: CanonicalCatalogImportStorage) {}

	async import(input: {
		platform: CatalogPlatform;
		sourceRoot: string;
		canonicalRoot: string;
		databaseRoot: string;
	}): Promise<CanonicalCatalogImportResult> {
		const sourcePaths = await this.storage.listSourceFiles(
			input.platform,
			input.sourceRoot,
		);
		if (sourcePaths.length === 0) {
			return createResult(input, [
				failedEntry(
					null,
					input.sourceRoot,
					null,
					new CatalogImportError(
						'catalog-source-empty',
						'Catalog source root contains no target files',
					),
				),
			]);
		}

		const parsed = sourcePaths.map((sourcePath) => {
			try {
				return {
					sourcePath,
					identity: parseCatalogSourceFilename(
						input.platform,
						basename(sourcePath),
					),
					error: null,
				};
			} catch (error) {
				return {
					sourcePath,
					identity: null,
					error: new CatalogImportError(
						'catalog-source-invalid',
						errorMessage(error),
					),
				};
			}
		});
		const identityCounts = new Map<string, number>();
		for (const entry of parsed) {
			if (entry.identity !== null) {
				const key = catalogImportIdentityKey(entry.identity);
				identityCounts.set(key, (identityCounts.get(key) ?? 0) + 1);
			}
		}

		const entries: CatalogImportEntry[] = [];
		for (const entry of parsed) {
			if (entry.identity === null) {
				entries.push(
					failedEntry(null, entry.sourcePath, null, requireError(entry.error)),
				);
				continue;
			}
			const destinationPath = join(
				input.canonicalRoot,
				canonicalCatalogRelativePath(entry.identity),
			);
			const databaseDestinationPath = join(
				input.databaseRoot,
				canonicalCatalogDatabaseRelativePath(entry.identity),
			);
			if (
				(identityCounts.get(catalogImportIdentityKey(entry.identity)) ?? 0) > 1
			) {
				entries.push(
					failedEntry(
						entry.identity,
						entry.sourcePath,
						destinationPath,
						new CatalogImportError(
							'catalog-identity-collision',
							'Multiple catalog sources resolve to the same identity',
						),
					),
				);
				continue;
			}
			try {
				const artifact = await this.storage.readAndValidateSource(
					entry.identity,
					entry.sourcePath,
				);
				const status = await this.storage.store(
					artifact,
					destinationPath,
					databaseDestinationPath,
				);
				entries.push({
					identity: entry.identity,
					sourcePath: entry.sourcePath,
					destinationPath,
					sha256: artifact.sha256,
					status,
					error: null,
				});
			} catch (error) {
				entries.push(
					failedEntry(
						entry.identity,
						entry.sourcePath,
						destinationPath,
						asCatalogImportError(error),
					),
				);
			}
		}
		return createResult(input, entries);
	}
}

function createResult(
	input: {
		platform: CatalogPlatform;
		sourceRoot: string;
		canonicalRoot: string;
		databaseRoot: string;
	},
	entries: readonly CatalogImportEntry[],
): CanonicalCatalogImportResult {
	const counts = {
		copied: entries.filter((entry) => entry.status === 'copied').length,
		existing: entries.filter((entry) => entry.status === 'existing').length,
		failed: entries.filter((entry) => entry.status === 'failed').length,
	};
	return {
		formatVersion: 1,
		operation: 'canonical-catalog-import',
		status: counts.failed === 0 ? 'succeeded' : 'failed',
		platform: input.platform,
		sourceRoot: input.sourceRoot,
		canonicalRoot: input.canonicalRoot,
		databaseRoot: input.databaseRoot,
		counts,
		entries,
	};
}

function failedEntry(
	identity: CatalogImportIdentity | null,
	sourcePath: string,
	destinationPath: string | null,
	error: CatalogImportError,
): CatalogImportEntry {
	return {
		identity,
		sourcePath,
		destinationPath,
		sha256: null,
		status: 'failed',
		error: { code: error.code, message: error.message },
	};
}

function asCatalogImportError(error: unknown): CatalogImportError {
	return error instanceof CatalogImportError
		? error
		: new CatalogImportError('catalog-import-io-failed', errorMessage(error));
}

function requireError(error: CatalogImportError | null): CatalogImportError {
	if (error === null) {
		throw new Error('Catalog import parse error is absent');
	}
	return error;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
