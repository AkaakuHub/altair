import { describe, expect, test } from 'bun:test';
import {
	type ContentAddressedBlobStore,
	contentAddressedBlob,
	decideBlobStorage,
} from '../src/master-archive/domain/content-addressed-blob-store.ts';

describe('content-addressed master blob store domain', () => {
	test('同じbytesをplatformとversionに依存しない同じaddressへ割り当てる', () => {
		const androidBlob = contentAddressedBlob(
			new TextEncoder().encode('master table bytes'),
		);
		const iosBlob = contentAddressedBlob(
			new TextEncoder().encode('master table bytes'),
		);

		expect(androidBlob.sha256).toBe(iosBlob.sha256);
		expect(
			decideBlobStorage(iosBlob.sha256, new Set([androidBlob.sha256])),
		).toBe('reuse');
	});

	test('version番号が同じでも異なるbytesを共有しない', () => {
		const androidBlob = contentAddressedBlob(
			new TextEncoder().encode('android bytes'),
		);
		const iosBlob = contentAddressedBlob(new TextEncoder().encode('ios bytes'));

		expect(androidBlob.sha256).not.toBe(iosBlob.sha256);
		expect(
			decideBlobStorage(iosBlob.sha256, new Set([androidBlob.sha256])),
		).toBe('store');
	});

	test('呼出側のbytes変更からblob内容を分離する', () => {
		const sourceBytes = new Uint8Array([1, 2, 3]);
		const blob = contentAddressedBlob(sourceBytes);

		sourceBytes[0] = 9;
		expect(blob.bytes).toEqual(new Uint8Array([1, 2, 3]));
	});

	test('portはcontent hashで存在確認、読込、保存を扱う', async () => {
		const port: ContentAddressedBlobStore = {
			contains: async () => false,
			read: async () => null,
			write: async () => 'stored',
		};
		const blob = contentAddressedBlob(new Uint8Array([1, 2, 3]));

		expect(await port.contains(blob.sha256)).toBeFalse();
		expect(await port.read(blob.sha256)).toBeNull();
		expect(await port.write(blob)).toBe('stored');
	});
});
