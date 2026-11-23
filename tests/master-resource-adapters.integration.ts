import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MasterResourceImportReport } from '../src/master-archive/domain/master-resource-import.ts';
import {
	NodeContentAddressedBlobStore,
	NodeMasterDecodeReportStore,
} from '../src/master-archive/infrastructure/node-master-archive-stores.ts';
import {
	SavedMasterResourceDecryptor,
	SavedMasterResourceIntegrityVerifier,
} from '../src/master-archive/infrastructure/saved-master-resource-adapters.ts';
import {
	encryptedResource,
	entry,
} from './masterImport/fixtures/savedMasterResource.ts';

describe('master resource infrastructure adapters', () => {
	test('verifies and decrypts the saved R2604100 CardDatas resource', async () => {
		const encryptedBytes = await Bun.file(encryptedResource).bytes();

		const integrity = new SavedMasterResourceIntegrityVerifier().verify(
			entry,
			encryptedBytes,
		);
		const decoded = new SavedMasterResourceDecryptor().decrypt(
			entry,
			encryptedBytes,
		);

		expect(integrity.encryptedSha256).toBe(
			createHash('sha256').update(encryptedBytes).digest('hex'),
		);
		expect(createHash('sha256').update(decoded).digest('hex')).toBe(
			'98f246bc6cea5e8c8d46b34758b89cc4f5595b76c901d8e4a1a71e6d9694a56b',
		);
	});

	test('deduplicates raw blobs and preserves an identical decode report', async () => {
		const root = await mkdtemp(join(tmpdir(), 'master-archive-'));
		try {
			const bytes = Uint8Array.from([0xda, 0x00, 0x00, 0xfb, 0x00, 0x00]);
			const sha256 = createHash('sha256').update(bytes).digest('hex');
			const blobStore = new NodeContentAddressedBlobStore(join(root, 'blobs'));
			expect(await blobStore.write({ sha256, bytes })).toBe('stored');
			expect(await blobStore.write({ sha256, bytes })).toBe('already-present');
			expect(await blobStore.read(sha256)).toEqual(bytes);

			const report: MasterResourceImportReport = {
				platform: 'android',
				tableLabel: 'empty.tsv',
				catalogResourceIdentity: 'android-empty',
				encryptedSha256: 'a'.repeat(64),
				blobSha256: sha256,
				status: 'decoded',
				schemaFingerprint: 'b'.repeat(64),
				decode: {
					status: 'decoded',
					tableLabel: 'empty.tsv',
					byteLength: bytes.length,
					consumedByteLength: bytes.length,
					rowCount: 0,
					fieldCount: 0,
					fields: [],
					unknownFieldCrcs: [],
				},
			};
			const reportStore = new NodeMasterDecodeReportStore(
				join(root, 'reports'),
			);
			await reportStore.write(report);
			await reportStore.write(report);
			const reportFiles = Array.from(
				new Bun.Glob('reports/android/*.json').scanSync(root),
			);
			expect(reportFiles).toHaveLength(1);
			expect(
				JSON.parse(await readFile(join(root, reportFiles[0] ?? ''), 'utf8')),
			).toEqual(report);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});
