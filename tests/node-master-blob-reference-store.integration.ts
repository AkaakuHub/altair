import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MasterResourceCatalogEntry } from '../src/master-archive/domain/master-resource-import.ts';
import { NodeMasterBlobReferenceStore } from '../src/master-archive/infrastructure/node-master-archive-stores.ts';

describe('Node master blob reference store', () => {
	test('round-trips a strict immutable reference and rejects extra fields', async () => {
		const root = await mkdtemp(join(tmpdir(), 'blob-references-'));
		try {
			const store = new NodeMasterBlobReferenceStore(root);
			const entry = catalogEntry();
			const reference = {
				schemaVersion: 1 as const,
				platform: entry.platform,
				catalogResourceIdentity: entry.catalogResourceIdentity,
				encryptedSha256: 'a'.repeat(64),
				blobSha256: 'b'.repeat(64),
			};
			await store.write(reference);
			expect(await store.read(entry)).toEqual(reference);

			const identity = createHash('sha256')
				.update(
					JSON.stringify({
						platform: entry.platform,
						catalogResourceIdentity: entry.catalogResourceIdentity,
					}),
				)
				.digest('hex');
			await Bun.write(
				join(root, entry.platform, `${identity}.json`),
				JSON.stringify({ ...reference, extra: true }),
			);
			await expect(store.read(entry)).rejects.toThrow();
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});

function catalogEntry(): MasterResourceCatalogEntry {
	return {
		platform: 'android',
		resourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
		tableLabel: 'carddatas.tsv',
		catalogResourceIdentity: 'c'.repeat(64),
		assetPath: 'raw/aa/example',
		encryptedSize: 1,
		catalogChecksum: '1',
		encryptionSalt: '2',
	};
}
