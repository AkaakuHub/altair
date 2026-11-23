import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MasterResourceImportService } from '../../src/master-archive/application/master-resource-import-service.ts';
import { createMasterResourcePayloadReader } from '../../src/master-archive/infrastructure/create-master-resource-payload-reader.ts';
import {
	NodeContentAddressedBlobStore,
	NodeMasterBlobReferenceStore,
	NodeMasterDecodeReportStore,
} from '../../src/master-archive/infrastructure/node-master-archive-stores.ts';
import {
	SavedMasterResourceDecryptor,
	SavedMasterResourceIntegrityVerifier,
} from '../../src/master-archive/infrastructure/saved-master-resource-adapters.ts';
import { STATIC_MASTER_FIELD_NAME_REGISTRY } from '../../src/master-archive/infrastructure/static-master-schema-field-sources.ts';
import { encryptedResource, entry } from './fixtures/savedMasterResource.ts';

test('空の保存先へローカルresを検証・復号して取り込み、再取り込みで同じデータを使う', async () => {
	const temporary = await mkdtemp(join(tmpdir(), 'file-master-import-'));
	try {
		const assets = join(temporary, 'asset files');
		const source = join(assets, entry.assetPath);
		await mkdir(dirname(source), { recursive: true });
		await copyFile(encryptedResource, source);
		const payloadReader = createMasterResourcePayloadReader(
			pathToFileURL(assets),
		);
		const blobStore = new NodeContentAddressedBlobStore(
			join(temporary, 'blobs'),
		);
		const service = new MasterResourceImportService({
			catalog: { readMasterEntries: async () => [entry] },
			payloadReader,
			integrityVerifier: new SavedMasterResourceIntegrityVerifier(),
			decryptor: new SavedMasterResourceDecryptor(),
			fieldNameRegistry: STATIC_MASTER_FIELD_NAME_REGISTRY,
			blobStore,
			blobReferenceStore: new NodeMasterBlobReferenceStore(
				join(temporary, 'references'),
			),
			reportStore: new NodeMasterDecodeReportStore(join(temporary, 'reports')),
		});
		const [first] = await service.importAll();
		expect(first).toMatchObject({
			status: 'decoded',
			blobWriteResult: 'stored',
			blobSha256:
				'98f246bc6cea5e8c8d46b34758b89cc4f5595b76c901d8e4a1a71e6d9694a56b',
		});
		if (first?.blobSha256 === null || first?.blobSha256 === undefined)
			throw new Error('Imported master blob is absent');
		const bytes = await blobStore.read(first.blobSha256);
		if (bytes === null) throw new Error('Imported master bytes are absent');
		expect(createHash('sha256').update(bytes).digest('hex')).toBe(
			first.blobSha256,
		);
		expect(first.rowCount).toBeGreaterThan(0);
		await rm(source);
		expect(await service.importAll()).toEqual([
			{ ...first, blobWriteResult: 'already-present' },
		]);
		await expect(payloadReader.read(entry.assetPath)).rejects.toThrow();
		for (const invalid of [
			'../outside',
			'/absolute',
			'https://example.invalid/file',
			'raw/zz/../../outside',
		])
			await expect(payloadReader.read(invalid)).rejects.toThrow(
				'Catalog asset path is invalid',
			);
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
});

test('明示した取得元以外のプロトコルや曖昧なfile URLを拒否する', () => {
	expect(() =>
		createMasterResourcePayloadReader(new URL('ftp://example.invalid/')),
	).toThrow('must use file, HTTP or HTTPS');
	const file = pathToFileURL(join(tmpdir(), 'assets'));
	file.search = '?source=sample';
	expect(() => createMasterResourcePayloadReader(file)).toThrow(
		'query or fragment',
	);
	file.search = '';
	file.hash = '#sample';
	expect(() => createMasterResourcePayloadReader(file)).toThrow(
		'query or fragment',
	);
});
