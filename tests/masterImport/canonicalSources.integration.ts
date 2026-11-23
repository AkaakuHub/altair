import { expect, test } from 'bun:test';
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { importCanonicalCatalogs } from '../../src/canonical-catalog-import/infrastructure/node-canonical-catalog-import.ts';
import { MasterResourceImportService } from '../../src/master-archive/application/master-resource-import-service.ts';
import { AndroidMasterCatalogAdapter } from '../../src/master-archive/infrastructure/android-master-catalog-adapter.ts';
import { createMasterResourcePayloadReader } from '../../src/master-archive/infrastructure/create-master-resource-payload-reader.ts';
import { IosMasterCatalogAdapter } from '../../src/master-archive/infrastructure/ios-master-catalog-adapter.ts';
import {
	NodeContentAddressedBlobStore,
	NodeMasterBlobReferenceStore,
	NodeMasterDecodeReportStore,
} from '../../src/master-archive/infrastructure/node-master-archive-stores.ts';
import {
	GzipInspixCatalogReader,
	SqliteSourceCatalogReader,
} from '../../src/master-archive/infrastructure/saved-catalog-readers.ts';
import {
	SavedMasterResourceDecryptor,
	SavedMasterResourceIntegrityVerifier,
} from '../../src/master-archive/infrastructure/saved-master-resource-adapters.ts';
import {
	fileSha256,
	savedCatalogProfiles,
} from '../../src/master-archive/infrastructure/saved-master-source-locator.ts';
import { STATIC_MASTER_FIELD_NAME_REGISTRY } from '../../src/master-archive/infrastructure/static-master-schema-field-sources.ts';
import { parseInspixCatalogJson } from '../../src/resources/domain/assets/inspixCatalog.ts';
import { createSqliteCatalog } from '../../src/resources/infrastructure/catalog/sqliteCatalogWriter.ts';
import { encryptedResource, entry } from './fixtures/savedMasterResource.ts';

test('Android・iOSのカタログ取り込みからローカルresのマスター取り込みへ共通の配置で接続する', async () => {
	const root = await mkdtemp(join(tmpdir(), 'canonical-master-import-'));
	try {
		const clientVersion = '5.1.0';
		const resourceVersion = entry.resourceVersion;
		const identity = `${clientVersion}__${Buffer.from(resourceVersion).toString('base64url')}`;
		const catalogJson = JSON.stringify([
			{
				Priority: 0,
				ResourceType: 192,
				Size: entry.encryptedSize,
				StrTypeCrc: 'tsv',
				StrContentTypeCrcs: [],
				StrCategoryCrcs: ['masterdata'],
				StrLabelCrc: entry.tableLabel,
				StrContentNameCrcs: [],
				StrDepCrcs: [],
				Checksum: entry.catalogChecksum,
				Seed: entry.encryptionSalt,
			},
		]);
		const canonicalRoot = join(root, 'catalogs');
		const assets = join(root, 'assets');
		const resource = join(assets, entry.assetPath);
		await mkdir(dirname(resource), { recursive: true });
		await copyFile(encryptedResource, resource);
		for (const platform of ['android', 'ios'] as const) {
			const sourceRoot = join(root, 'sources', platform);
			await mkdir(sourceRoot, { recursive: true });
			const filename =
				platform === 'android'
					? `${identity}__cache__catalog.json.gz`
					: `${identity}.sqlite3`;
			const bytes =
				platform === 'android'
					? gzipSync(catalogJson)
					: createSqliteCatalog(parseInspixCatalogJson(catalogJson), {
							platform,
							clientVersion,
							resourceVersion,
						});
			await Bun.write(join(sourceRoot, filename), bytes);
			const imported = await importCanonicalCatalogs({
				platform,
				sourceRoot,
				canonicalRoot,
				databaseRoot: join(root, 'catalog-indexes'),
			});
			expect(imported.status).toBe('succeeded');
		}
		const profiles = await savedCatalogProfiles(
			{
				android: { [clientVersion]: [resourceVersion] },
				ios: { [clientVersion]: [resourceVersion] },
			},
			canonicalRoot,
		);
		expect(profiles).toHaveLength(2);
		const blobStore = new NodeContentAddressedBlobStore(join(root, 'blobs'));
		const references = new NodeMasterBlobReferenceStore(
			join(root, 'references'),
		);
		const reports = new NodeMasterDecodeReportStore(join(root, 'reports'));
		for (const profile of profiles) {
			const hash = await fileSha256(profile.path);
			const catalog =
				profile.platform === 'android'
					? new AndroidMasterCatalogAdapter(
							new GzipInspixCatalogReader(profile.path, hash),
							profile.resourceVersion,
						)
					: new IosMasterCatalogAdapter(
							new SqliteSourceCatalogReader(profile.path, hash),
							profile.resourceVersion,
						);
			const service = new MasterResourceImportService({
				catalog,
				payloadReader: createMasterResourcePayloadReader(pathToFileURL(assets)),
				integrityVerifier: new SavedMasterResourceIntegrityVerifier(),
				decryptor: new SavedMasterResourceDecryptor(),
				fieldNameRegistry: STATIC_MASTER_FIELD_NAME_REGISTRY,
				blobStore,
				blobReferenceStore: references,
				reportStore: reports,
			});
			const results = await service.importAll();
			expect(results).toHaveLength(1);
			expect(results[0]).toMatchObject({
				status: 'decoded',
				entry: { platform: profile.platform, assetPath: entry.assetPath },
				blobSha256:
					'98f246bc6cea5e8c8d46b34758b89cc4f5595b76c901d8e4a1a71e6d9694a56b',
			});
		}
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
