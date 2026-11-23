import { describe, expect, test } from 'bun:test';
import {
	catalogIdentity,
	createCatalogMasterManifest,
} from '../src/master-archive/domain/catalog-master-manifest.ts';
import type { MasterResourceCatalogEntry } from '../src/master-archive/domain/master-resource-import.ts';

const sourceSha256 = 'a'.repeat(64);
const resourceVersion = 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==';

function entry(platform: 'android' | 'ios'): MasterResourceCatalogEntry {
	return {
		platform,
		resourceVersion,
		tableLabel: 'carddatas.tsv',
		catalogResourceIdentity: 'b'.repeat(64),
		assetPath: 'raw/aa/abcdefghijklmnopqrstuvwxyz',
		encryptedSize: 10,
		catalogChecksum: '12',
		encryptionSalt: '34',
	};
}

describe('saved master catalog manifest', () => {
	test('records catalog entries before resource decoding', () => {
		const identity = catalogIdentity({
			platform: 'android',
			clientVersion: '5.1.0',
			resourceVersion,
			sourceSha256,
		});
		const manifest = createCatalogMasterManifest({
			clientVersion: '5.1.0',
			resourceVersion,
			catalogIdentitySha256: identity,
			catalogSourceSha256: sourceSha256,
			entries: [entry('android')],
		});

		expect(manifest).toMatchObject({
			platform: 'android',
			catalog: { identitySha256: identity, sourceSha256 },
			tables: [{ label: 'carddatas.tsv', encryptedSize: 10 }],
		});
	});

	test('rejects entries from a different platform profile', () => {
		expect(() =>
			createCatalogMasterManifest({
				clientVersion: '5.1.0',
				resourceVersion,
				catalogIdentitySha256: 'c'.repeat(64),
				catalogSourceSha256: sourceSha256,
				entries: [entry('android'), entry('ios')],
			}),
		).toThrow('Master catalog entry profile differs');
	});
});
