import { join } from 'node:path';
import { canonicalCatalogDatabaseRelativePath } from '../../canonical-catalog-import/domain/catalog-import-identity.ts';
import { storeImmutableFile } from '../../canonical-catalog-import/infrastructure/node-immutable-file-store.ts';
import type { BinaryCatalogEntry } from '../../resources/domain/assets/catalogBinary.ts';
import { createSqliteCatalog } from '../../resources/infrastructure/catalog/sqliteCatalogWriter.ts';

type SavedCatalogIdentity = Readonly<{
	platform: 'android' | 'ios';
	clientVersion: string;
	resourceVersion: string;
}>;

export class NodeSavedCatalogIndexStore {
	constructor(private readonly archiveRoot: string) {}

	async write(
		identity: SavedCatalogIdentity,
		entries: readonly BinaryCatalogEntry[],
	): Promise<string> {
		const path = join(
			this.archiveRoot,
			'catalog-indexes',
			canonicalCatalogDatabaseRelativePath(identity),
		);
		await storeImmutableFile(
			path,
			createSqliteCatalog(entries, identity),
			() => new Error(`Saved catalog index conflicts: ${path}`),
		);
		return path;
	}
}
