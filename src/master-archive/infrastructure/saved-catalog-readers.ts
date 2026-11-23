import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import type { CatalogSourceReader } from '../../resources/application/catalog/sourceReader.ts';
import type { BinaryCatalogEntry } from '../../resources/domain/assets/catalogBinary.ts';
import { parseInspixCatalogJson } from '../../resources/domain/assets/inspixCatalog.ts';
import { readSqliteCatalog } from '../../resources/infrastructure/catalog/sqliteCatalogReader.ts';

export class GzipInspixCatalogReader implements CatalogSourceReader {
	constructor(
		private readonly path: string,
		private readonly expectedSha256: string,
	) {}

	async read(): Promise<BinaryCatalogEntry[]> {
		const compressed = await readFile(this.path);
		verifySourceHash(compressed, this.expectedSha256);
		return parseInspixCatalogJson(gunzipSync(compressed).toString('utf8'));
	}
}

export class SqliteSourceCatalogReader implements CatalogSourceReader {
	constructor(
		private readonly path: string,
		private readonly expectedSha256: string,
	) {}

	async read(): Promise<BinaryCatalogEntry[]> {
		verifySourceHash(await readFile(this.path), this.expectedSha256);
		return readSqliteCatalog(this.path);
	}
}

function verifySourceHash(bytes: Uint8Array, expectedSha256: string): void {
	const actualSha256 = createHash('sha256').update(bytes).digest('hex');
	if (actualSha256 !== expectedSha256) {
		throw new Error('Saved catalog SHA-256 differs');
	}
}
