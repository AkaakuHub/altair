import { describe, expect, test } from 'bun:test';
import { MasterResourceImportService } from '../src/master-archive/application/master-resource-import-service.ts';
import { AndroidMasterCatalogAdapter } from '../src/master-archive/infrastructure/android-master-catalog-adapter.ts';
import { IosMasterCatalogAdapter } from '../src/master-archive/infrastructure/ios-master-catalog-adapter.ts';
import type { BinaryCatalogEntry } from '../src/resources/domain/assets/catalogBinary.ts';

const androidResourceVersion = 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==';
const iosResourceVersion = 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==';

const cardDatasEntry: BinaryCatalogEntry = {
	priority: 0,
	resourceType: 192,
	size: 16,
	type: 'tsv',
	contents: [{ label: 'carddatas.tsv', type: 'tsv' }],
	categories: ['masterdata', 'client'],
	label: 'carddatas.tsv',
	dependencies: [],
	checksum: 123n,
	encryptionSalt: 456n,
};

describe('iOS master resource importer', () => {
	test('keeps a distinct catalog identity for the same logical Android and iOS table', async () => {
		const sourceReader = { read: async () => [cardDatasEntry] };
		const android = (
			await new AndroidMasterCatalogAdapter(
				sourceReader,
				androidResourceVersion,
			).readMasterEntries()
		)[0];
		const ios = (
			await new IosMasterCatalogAdapter(
				sourceReader,
				iosResourceVersion,
			).readMasterEntries()
		)[0];
		if (android === undefined || ios === undefined) {
			throw new Error('Platform catalog entry is missing');
		}

		expect(ios).toMatchObject({
			platform: 'ios',
			resourceVersion: iosResourceVersion,
			tableLabel: android.tableLabel,
			assetPath: android.assetPath,
		});
		expect(ios.catalogResourceIdentity).not.toBe(
			android.catalogResourceIdentity,
		);
	});

	test('imports through the same domain service as Android', async () => {
		const entry = (
			await new IosMasterCatalogAdapter(
				{ read: async () => [cardDatasEntry] },
				iosResourceVersion,
			).readMasterEntries()
		)[0];
		if (entry === undefined) throw new Error('iOS catalog entry is missing');
		const rawBinary = Uint8Array.from([
			0xda, 0x00, 0x00, 0xfb, 0x01, 0x01, 0xdb, 0xac, 0x3d, 0x2a, 0x00, 0x00,
			0x00, 0x20, 0x07,
		]);
		const reports: Array<{ platform: string; status: string }> = [];
		const service = new MasterResourceImportService({
			catalog: { readMasterEntries: async () => [entry] },
			payloadReader: { read: async () => Uint8Array.from([1]) },
			integrityVerifier: {
				verify: () => ({ encryptedSha256: 'a'.repeat(64) }),
			},
			decryptor: { decrypt: () => rawBinary },
			fieldNameRegistry: { resolve: () => 'Id' },
			blobStore: {
				contains: async () => false,
				read: async () => null,
				write: async () => 'stored',
			},
			blobReferenceStore: { read: async () => null, write: async () => {} },
			reportStore: {
				read: async () => null,
				write: async (report) => {
					reports.push({ platform: report.platform, status: report.status });
				},
			},
		});

		const result = await service.importEntry(entry);

		expect(result.status).toBe('decoded');
		expect(result.entry.platform).toBe('ios');
		expect(reports).toEqual([{ platform: 'ios', status: 'decoded' }]);
	});
});
