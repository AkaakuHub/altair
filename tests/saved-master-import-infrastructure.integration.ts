import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createCatalogMasterManifest } from '../src/master-archive/domain/catalog-master-manifest.ts';
import { NodeMasterManifestStore } from '../src/master-archive/infrastructure/node-master-manifest-store.ts';
import { GzipInspixCatalogReader } from '../src/master-archive/infrastructure/saved-catalog-readers.ts';

describe('saved master import infrastructure', () => {
	test('reads a saved gzip catalog and stores its catalog-first manifest idempotently', async () => {
		const root = await mkdtemp(join(tmpdir(), 'saved-master-import-'));
		try {
			const catalogPath = join(root, 'catalog.json.gz');
			const catalogBytes = gzipSync(
				JSON.stringify([
					{
						Priority: 0,
						ResourceType: 192,
						Size: 12,
						StrTypeCrc: 'tsv',
						StrContentTypeCrcs: [],
						StrCategoryCrcs: ['masterdata'],
						StrLabelCrc: 'carddatas.tsv',
						StrContentNameCrcs: [],
						StrDepCrcs: [],
						Checksum: '34',
						Seed: '56',
					},
				]),
			);
			await Bun.write(catalogPath, catalogBytes);
			const entries = await new GzipInspixCatalogReader(
				catalogPath,
				createHash('sha256').update(catalogBytes).digest('hex'),
			).read();
			expect(entries).toHaveLength(1);

			const archiveRoot = join(root, 'archive');
			const store = new NodeMasterManifestStore(archiveRoot);
			const manifest = createCatalogMasterManifest({
				clientVersion: '5.1.0',
				resourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
				catalogIdentitySha256: 'a'.repeat(64),
				catalogSourceSha256: 'b'.repeat(64),
				entries: [
					{
						platform: 'android',
						resourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
						tableLabel: 'carddatas.tsv',
						catalogResourceIdentity: 'c'.repeat(64),
						assetPath: 'raw/aa/abcdefghijklmnopqrstuvwxyz',
						encryptedSize: 12,
						catalogChecksum: '34',
						encryptionSalt: '56',
					},
				],
			});
			await store.writeCatalog(manifest);
			await store.writeCatalog(manifest);
			const paths = Array.from(
				new Bun.Glob('catalog-manifests/android/*.json').scanSync(archiveRoot),
			);
			expect(paths).toHaveLength(1);
			expect(
				JSON.parse(await readFile(join(archiveRoot, paths[0] ?? ''), 'utf8')),
			).toEqual(manifest);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});
